import pandas as pd
import tensorflow as tf
from flask import current_app as app
from flask import request, jsonify
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import linear_kernel

from util.categories import categories
from util.convert_tensor import convert_sparse_matrix_to_sparse_tensor
from util.komoran_preprocessing import koma_file, filter_stopword
from util.stopwords import get_stopwords
from util.recommend_preprocessing import get_recommendations, mapping_category

import requests

check_tf_idf, check_model = None, None


@app.route('/search')
def search():
    is_ac = request.args.get('is_ac')
    is_ac = int(is_ac)
    title = request.args.get("title")
    if not title:
        return
    # check_tf_idf = None
    global check_tf_idf
    global check_model

    # 임베딩 모델
    if is_ac:
        with open("model/ac_model/ac_0608-00_31_TfidfVectorizer().pickle", 'rb') as f:
            check_tf_idf = pd.read_pickle(f)
    else:
        with open("model/bc_0601-06_49_TfidfVectorizer(max_features=10000).pickle", 'rb') as f:
            check_tf_idf = pd.read_pickle(f)

    # 불용어 처리 csv
    stopwords = get_stopwords()

    # komoran 형태소 분석 및 불용어 처리
    df = pd.DataFrame({'제목': [title]})
    koma_df = koma_file(df)
    check_bul_df = filter_stopword(koma_df, stopwords, col_name='제목')
    check_bul_df.reset_index(drop=True, inplace=True)

    # tf-idf 처리 및 모델 예측
    check_tf_title = check_tf_idf.transform(check_bul_df['제목'].values.astype('U'))

    if is_ac:
        check_model = tf.keras.models.load_model("model/ac_model/ac_model_TfidfVectorizer()_0.85010105")
    else:
        check_model = tf.keras.models.load_model("model/bc_model_TfidfVectorizer(max_features=10000)_0.973622")

    if is_ac:
        check_model.load_weights("model/ac_model/ac_0608-00_31_11-0.8544.h5")
    else:
        check_model.load_weights("model/bc_0601-06_49_01-0.9741.h5")

    sparse_tensor = convert_sparse_matrix_to_sparse_tensor(check_tf_title)
    check_tf_title_reorder = tf.sparse.reorder(sparse_tensor)

    result = check_model.predict_proba(check_tf_title_reorder)

    # 예측한 결과를 포맷팅
    categories_ = categories()
    result_dict = dict()
    for i, cat in enumerate(categories_):
        result_dict[cat] = result[0][i]
    result_dict = {k: float(v) for k, v in result_dict.items()}

    # print(result_dict)

    return jsonify(result_dict)


@app.route('/recommend')
def recommend():
    title = request.args.get('title')
    category = request.args.get('category')
    res = requests.get("http://localhost:8080/pages?category=" + mapping_category(category))
    if not res.json():
        return jsonify(res.json())

    # 불용어 처리 csv
    stopwords = get_stopwords()

    # komoran 형태소 분석 및 불용어 처리
    df = pd.DataFrame({'제목': [title]})
    koma_df = koma_file(df)
    check_bul_df = filter_stopword(koma_df, stopwords, col_name='제목')
    check_bul_df.reset_index(drop=True, inplace=True)

    # DB 데이터를 데이터 프레임으로 변환
    target_df = pd.DataFrame(data=res.json())
    # 추천
    target_df = target_df.append({"prepro": check_bul_df['제목'][0], "category": category, }, ignore_index=True)
    target_df.reset_index(drop=True, inplace=True)
    target_df = target_df.drop_duplicates("prepro")
    target_df.reset_index(drop=True, inplace=True)

    # TF-IDF
    tfidf = TfidfVectorizer()
    tfidf_matrix = tfidf.fit_transform(target_df["prepro"])
    # print(tfidf_matrix.shape)

    # 코사인 유사도
    cosine_sim = linear_kernel(tfidf_matrix, tfidf_matrix)

    # 인덱스 테이블
    indices = pd.Series(target_df.index, index=target_df["prepro"]).drop_duplicates()

    # 확인
    zxc = get_recommendations(check_bul_df['제목'][0], cosine_sim, indices, target_df)
    pid_list = zxc.iloc[:5, 0].tolist()
    title_list = zxc.iloc[:5, 1].tolist()
    param1_list = zxc.iloc[:5, 2].tolist()
    param2_list = zxc.iloc[:5, 3].tolist()
    result = []
    for i in range(5):
        result.append({
            'pid': pid_list[i],
            'title': title_list[i],
            'param1': param1_list[i],
            'param2': param2_list[i]
        })

    return jsonify(result)

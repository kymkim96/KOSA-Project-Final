import pandas as pd
import tensorflow as tf
from flask import current_app as app
from flask import request, jsonify

from util.categories import categories
from util.convert_tensor import convert_sparse_matrix_to_sparse_tensor
from util.komoran_preprocessing import koma_file, filter_stopword
from util.stopwords import get_stopwords

import requests

check_tf_idf, check_model = None, None


@app.route('/search')
def search():
    title = request.args.get("title")
    if not title:
        return
    # check_tf_idf = None
    global check_tf_idf
    global check_model

    # 임베딩 모델
    if not check_tf_idf:
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

    if not check_model:
        check_model = tf.keras.models.load_model("model/bc_model_TfidfVectorizer(max_features=10000)_0.973622")
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
    res = requests.get("http://localhost:8080/pages?category=건강")
    print(res.json())

    # DB 데이터를 데이터 프레임으로 변환
    target_df = pd.DataFrame(data=res.json())
    source_df = pd.DataFrame({'제목': [title]})

    return jsonify(res.json())

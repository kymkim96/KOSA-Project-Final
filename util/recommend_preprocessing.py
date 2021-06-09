import pandas as pd
import re


def mapping_category(category):
    mapping_ = {
        '건강': 'health',
        '경제': 'economy',
        '교육': 'education',
        '규제개혁': 'regulation',
        '복지': 'welfare',
        '안전': 'secure',
        '여가': 'leisure',
        '보육': 'nursery',
        '일자리': 'job',
        '주택': 'house',
        '행정재정': 'finance',
        '환경': 'environment'
    }
    return mapping_[category]


def get_recommendations(title, cosine_sim, indices, target_df):
    # 선택한 영화의 타이틀로부터 해당되는 인덱스를 받아옵니다. 이제 선택한 영화를 가지고 연산할 수 있습니다.
    idx = indices[title]

    # 모든 영화에 대해서 해당 영화와의 유사도를 구합니다.
    sim_scores = list(enumerate(cosine_sim[idx]))

    # 유사도에 따라 영화들을 정렬합니다.
    sim_scores = sorted(sim_scores, key=lambda x: x[1], reverse=True)

    # 가장 유사한 10개의 영화를 받아옵니다.
    sim_scores = sim_scores[1:150]

    # 가장 유사한 10개의 영화의 인덱스를 받아옵니다.
    movie_indices = [i[0] for i in sim_scores]

    asd = target_df.iloc[movie_indices]
    asd = pd.DataFrame(asd)
    asd["prepro"] = asd["prepro"].map(lambda x: re.sub(' +', ' ', x))
    asd = asd.drop_duplicates(subset=["prepro"])

    # 가장 유사한 10개의 영화의 prepro을 리턴합니다.
    return asd
from konlpy.tag import Komoran
import re


def word_cut(temp_title):
    temp = []
    for i in range(len(temp_title)):
        if len(temp_title[i]) > 1:
            temp.append(temp_title[i])

    return temp


def koma_file(df):
    komoran = Komoran()
    temp_title = df["제목"][0]
    temp_title = komoran.nouns(temp_title)

    temp_title = word_cut(temp_title)

    df["제목"][0] = temp_title

    return df


def filter_stopword(df, stopwords, col_name):
    from string import digits

    # 불용어를 단어 길이별로 나누기
    one_word = []
    two_word = []
    th_word = []
    fr_word = []
    fi_word = []
    ect_word = []
    for j in stopwords:
        w_len = len(j)

        if w_len == 1:
            one_word.append(j)

        elif w_len == 2:
            two_word.append(j)

        elif w_len == 3:
            th_word.append(j)

        elif w_len == 4:
            fr_word.append(j)

        elif w_len == 5:
            fi_word.append(j)

        elif w_len > 5:
            ect_word.append(j)

    # df 값과 비교하기
    temp_df = df.copy()

    temp = temp_df[col_name][0]
    temp = " ".join(temp)

    # 숫자
    remove_digits = str.maketrans('', '', digits)

    temp = temp.translate(remove_digits)

    # 특수 문자
    symbols = ["`", "~", "!", "@", "#", "$", "%", "^", "&", "*", "(", ")", "_", "-", "+",
               "=", "{", "[", "]", "}", "|", "\\", ":", ";", "\"", "<", ",", ">", ".", "?", "/", "ㆍ"]
    d = dict.fromkeys(''.join(symbols), '')
    t = str.maketrans(d)
    remove_sym = temp.translate(t)

    # 한글 자모음 제거
    kor_alph = '([ㄱ-ㅎㅏ-ㅣ])+'
    remove_kor = re.sub(pattern=kor_alph, repl="", string=remove_sym)

    # 영어 알파벳 제거
    eng_alpha = "([a-zA-Z])+"
    remove_eng = re.sub(pattern=eng_alpha, repl="", string=remove_kor)

    # 형태소 분석 한 csv를 불러왔을 때 처리하기
    temp = str(remove_eng).split("'")
    remove = ["[", "]", ", "]
    temp = [x for x in temp if x not in remove]

    word_list = []
    for word in temp:

        if len(word) == 1:
            if word not in one_word:
                word_list.append(word)

        elif len(word) == 2:
            if word not in two_word:
                word_list.append(word)

        elif len(word) == 3:
            if word not in th_word:
                word_list.append(word)

        elif len(word) == 4:
            if word not in fr_word:
                word_list.append(word)

        elif len(word) == 5:
            if word not in fi_word:
                word_list.append(word)

        elif len(word) > 5:
            if word not in ect_word:
                word_list.append(word)

    # 다시 문자열로 바꾸기

    tmp_str = " ".join(word_list)

    temp_df[col_name][0] = tmp_str

    return temp_df

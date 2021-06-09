$(() => {
    const div_box = "<div id='div_box' class='d-flex justify-content-center align-items-center'" +
        " style='width: 812px; height: 400px;'>"
    const div_spinner = "<div class=\"spinner-border text-info\"" +
        " role=\"status\" id=\"spin_recommend\"" +
        " style='width: 4rem; height: 4rem;'>"
    let plotly_temp;
    let recommend_list;

    const recommend_func = () => {
        // 카테고리 선택안하고 추천 버튼을 눌렀을 시 예외처리
        if (!$("input:radio[name='check']:checked").val()) {
            const recommend_warning = '<div class="row ms-4 mt-2" id="recommend_warning">' +
                            '<span class="text-danger">카테고리를 선택해주세요</span>' +
                            '</div>'
            $("#recommend_btn").after(recommend_warning)
            return;
        }

        // 경고글이 표시되어 있고 올바른 입력이 들어왔을 때 예외처리
        if ($("#recommend_warning").length) {
            $("#recommend_warning").remove()
        }

        if ($("#plotly-view").length) {
            plotly_temp = $("#plotly-view")
            plotly_temp
            .replaceWith(div_box + div_spinner +
                                  "<span class=\"visually-hidden\">Loading...</span>" +
                               "</div>" + "</div>")
        } else if ($("#spin_recommend").length) {
            return;
        } else {
            $("#list_over").empty()
            $("#list_over")
                .append(div_box + div_spinner +
                          "<span class=\"visually-hidden\">Loading...</span>" +
                       "</div>" + "</div>")
        }

        // console.log($("#show_title").text())
        $.ajax({
            url: '/recommend',
            method: 'get',
            data: {
                title: $("#show_title").text(),
                category: $("input:radio[name='check']:checked").val()
            },
            success: (data) => {
                if (data.length === 0) {
                    $("#list_over").empty()
                    $("#list_over").append(plotly_temp)
                    return;
                }
                const item_id_group = []
                let list_group = ""
                for (let page of data) {
                    list_group += "<button type='button' class='list-group-item list-group-item-action'" +
                    " id=" + 'item' + page['pid'] + ">" +
                        page['title'] +
                        "</button>"
                    item_id_group.push(['item' + page['pid'], page['param1'], page['param2']])
                }
                // const icon = '<div class="container-md">' +
                //                 '<div class="row">' +
                //                     '<div class="col-md-4">' +
                //                         '<button type="button" id="back_chart" class="btn btn-dark">pie 차트로 돌아가기</button>' +
                //                     '</div>' +
                //                     '<div class="col-md-8 invisible">여백</div>' +
                //                 '</div>' +
                //             '</div>'
                $("#spin_recommend")
                    .replaceWith( "<div id='recomend_list'>" + '<button type="button" id="back_chart" class="btn btn-dark">' +
                            'pie 차트로 돌아가기</button>' +
                            "<div class='list-group list-group-flush'>" +
                            list_group +
                            "</div>" + "</div>")
                recommend_list = $("#recommend_list");

                for (let item_id of item_id_group) {
                    $(document).on('click', '#'+item_id[0], () => {
                        const form_string = '<form id="recommend_form" method="post" ' +
                            'action="https://www.open.go.kr/othicInfo/infoList/infoListDetl.do" ' +
                            'target="recommend_link">' +
                            '<input type="hidden" name="prdnNstRgstNo" value="' +
                            item_id[1] + '"/>' +
                            '<input type="hidden" name="prdnDt" value="' + item_id[2] + '"/>' +
                            '</form>'
                        $("#"+item_id[0]).after(form_string)

                        const form = $("#recommend_form")
                        window.open('about:blank', 'recommend_link')
                        form.action = "https://www.open.go.kr/othicInfo/infoList/infoListDetl.do"
                        form.target = 'recommend_link'
                        form.submit()

                        form.remove()
                    })
                }
            }
        })
    }
    $("#recommend_btn").click(() => {
        recommend_func()
    })

    $(document).on('click', '#back_chart', () => {
        $("#list_over").empty()
        $("#list_over").append(plotly_temp)
    });

    $("#title").on('keyup', (event) => {
        if(event.keyCode === 13) {
            // 빈 내용 입력 시 차단
            if (!event.target.value) {
                return
            }

            // 스피너 출력 및 데이터 영역 감추기
            $("#data-table").removeClass('visible')
            $("#data-table").addClass('invisible')
            $("#spin").removeClass('invisible')
            $("#spin").addClass('visible')
            $("#show_title").text(event.target.value)

            /**
             * http://localhost:8000/search
             * - params
             * title: 입력한 문서 제목
             */
            $.ajax({
                url: '/search',
                method: 'get',
                data: {
                    title: event.target.value,
                    is_ac,
                },
                success: (data) => {
                    if (!data) {
                        return
                    }

                    const categories = data
                    let ranking = []
                    const values = []
                    const labels = []
                    // 가장 적합한 카테고리 차등 표시
                    for (let cat in categories) {
                        ranking.push({
                            'name': cat,
                            'value': categories[cat]
                        })
                    }
                    ranking.sort(function (a, b) {
                      if (a.value > b.value) {
                        return -1;
                      }
                      if (a.value < b.value) {
                        return 1;
                      }
                      // a must be equal to b
                      return 0;
                    });

                    // 상위 3개와 etc로 변경
                    let sum = 0
                    let etc = '기타 카테고리'
                    for (let i = 0; i<ranking.length; i++) {
                        if (ranking[i].value > 0.01) {
                            values.push(ranking[i].value)
                            labels.push(ranking[i].name)
                        } else {
                            if (sum === 0 && i === ranking.length-1) {
                                etc = ranking[i].name
                            }
                            sum += ranking[i].value
                        }
                    }
                    values.push(sum)
                    labels.push(etc)

                    // 확률 파이 차트
                    const plotly_data = [{
                        values,
                        labels,
                        type: 'pie'
                    }]
                    const layout = [{
                        height: 300,
                        width: 1000
                    }]
                    if (!$("#plotly-view").length) {
                        $("#list_over").empty()
                        $("#list_over").append("<div id='plotly-view'></div>")
                    }
                    Plotly.newPlot('plotly-view', plotly_data, layout)

                    // 데이터 영역 출력 및 카테고리 영역 렌더링
                    $("#spin").removeClass('visible')
                    $("#spin").addClass('invisible')
                    $("#data-table").removeClass('invisible')
                    $("#data-table").addClass('visible')
                    $("#first_category").text(ranking[0].name)
                    $("#first_category_sub").text(ranking[0].name)
                    $('#first_check').val(ranking[0].name)
                    $("#first_percentage").text((Math.floor(ranking[0].value*1000)/1000*100).toFixed(1))

                    $("#second_category").text(ranking[1].name)
                    $("#second_category_sub").text(ranking[1].name)
                    $('#second_check').val(ranking[1].name)
                    if (Math.floor(ranking[1].value*1000) === 0) {
                        $("#second_percentage").text("0.1% 미만")
                    } else {
                        $("#second_percentage")
                            .text((Math.floor(ranking[1].value*1000)/1000*100).toFixed(1) + '%')
                    }

                    $("#third_category").text(ranking[2].name)
                    $("#third_category_sub").text(ranking[2].name)
                    $('#third_check').val(ranking[2].name)
                     if (Math.floor(ranking[2].value*1000) === 0) {
                        $("#third_percentage").text("0.1% 미만")
                    } else {
                        $("#third_percentage")
                            .text((Math.floor(ranking[2].value*1000)/1000*100).toFixed(1) + '%')
                    }
                    recommend_func()
                }
            })
        }
    });
    let is_ac = 0;
    const change_search = (value) => {
        if (!value) {
            $("#title").css({
                border: '1px solid #185adb'
            })
            $("#title").attr('placeholder', '2020년 이후 문서부터 입력해주세요')
            is_ac = value;
        } else {
            $("#title").css({
                border: '1px solid #e6e5e5'
            })
            $("#title").attr('placeholder', '2020년 이전 문서만 입력해주세요')
            is_ac = value;
        }
    }
    $("#change_search").on('click', () => {
        change_search(is_ac)
    })

    $("#left_btn").on('click', () => {
        change_search(1)
        $("#left_btn").css({
            background: "#1D4C97",
            color: "#FFFFFF"
        });
        $("#left_btn").attr('disabled', true);
        $("#right_btn").css({
            background: "",
            color: "#000000"
        });
        $("#right_btn").attr('disabled', false);
    })
    $("#right_btn").on('click', () => {
        change_search(0)
        $("#right_btn").css({
            background: "#1D4C97",
            color: "#FFFFFF"
        });
        $("#right_btn").attr('disabled', true);
        $("#left_btn").css({
            background: "",
            color: "#000000"
        });
        $("#left_btn").attr('disabled', false);
    })
})
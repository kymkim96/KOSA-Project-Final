$(() => {
    const div_box = "<div id='div_box' class='d-flex justify-content-center align-items-center'" +
        " style='width: 812px; height: 400px;'>"
    const div_spinner = "<div class=\"spinner-border text-info\"" +
        " role=\"status\" id=\"spin_recommend\"" +
        " style='width: 4rem; height: 4rem;'>"
    let plotly_temp;

    $("#recommend_btn").click(() => {
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

        $.ajax({
            url: '/recommend',
            method: 'get',
            data: {
                title: $("#show_title").val(),
                category: $("input:radio[name='check']:checked").val()
            },
            success: (data) => {
                const item_id_group = []
                let list_group = ""
                for (let page of data) {
                    list_group += "<button type='button' class='list-group-item list-group-item-action'" +
                    " id=" + 'item' + page['pid'] + ">" +
                        page['title'] +
                        "</button>"
                    item_id_group.push(['item' + page['pid'], page['param1'], page['param2']])
                }
                const icon = '<div class="container-md">' +
                                '<div class="row">' +
                                    '<div class="col-md-4">' +
                                        '<button type="button" id="back_chart" class="btn btn-dark">pie 차트로 돌아가기</button>' +
                                    '</div>' +
                                    '<div class="col-md-8 invisible">여백</div>' +
                                '</div>' +
                            '</div>'
                $("#list_over").prepend(icon)
                $("#spin_recommend")
                    .replaceWith("<div class='list-group'>" +
                        list_group +
                        "</div>")

                // TODO: 44, 45라인 파라미터 동적으로 받기
                for (let item_id of item_id_group) {
                    $(document).on('click', '#'+item_id[0], () => {
                        const form_string = '<form id="recommend_form" method="post" ' +
                            'action="https://www.open.go.kr/othicInfo/infoList/infoListDetl.do"' +
                            'target="recommend_link">' +
                            '<input type="hidden" name="prdnNstRgstNo" value="DCT79C0CD8BB0DD2B5F2771E74AF696D528"/>' +
                            '<input type="hidden" name="prdnDt" value="20210603102327"/>' +
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
    })

    $(document).on('click', '#back_chart', () => {
        $("#list_over").empty()
        $("#list_over").append(plotly_temp)
    })
});
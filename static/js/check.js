$(() => {
    const div_box = "<div class='d-flex justify-content-center align-items-center' style='width: 812px; height: 400px;'>"
    const div_spinner = "<div class=\"spinner-border text-info\"" +
        " role=\"status\" id=\"spin_recommend\"" +
        " style='width: 4rem; height: 4rem;'>"

    $("#recommend_btn").click(() => {
        if ($("#plotly-view").length) {
            $("#plotly-view")
            .replaceWith(div_box + div_spinner +
                                  "<span class=\"visually-hidden\">Loading...</span>" +
                               "</div>" + "</div>")
        } else if ($("#spin_recommend").length) {
            return
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
});
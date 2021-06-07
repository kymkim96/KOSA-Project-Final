$(() => {
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
                }
            })
        }
    });
})
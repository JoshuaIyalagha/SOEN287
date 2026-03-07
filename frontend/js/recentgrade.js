const exams =["first-exam","Second-exam","Third-exam","Forth-exam","Fifth-exam"];

const comp248grade=[70 , 60 , 90 ,80,100 ]
const comp249grade=[63 , 64 , 90 ,76,83 ]
const Soen287grade=[84 , 75 , 82 ,80,89 ]
const comp228grade=[95 , 73, 79 ,90,75 ]
const engr231grade=[100 , 94 , 90 ,89,100 ]


const myChart4=new Chart(document.getElementById("recent248"),


{           type:'line',
            data:{
                labels:exams,
                datasets:[{data:comp248grade,borderColor:'blue'},
                            

                ]},


                options:{ responsive: true,
                    plugins:{
            legend:{display: false}},
                    scales:{y:{min:50, max:100}}
                }

},




)



const myChart5=new Chart(document.getElementById("recent249"),


{           type:'line',
            data:{
                labels:exams,
                datasets:[
                            {data:comp249grade,borderColor:'red'},
                            

                ]},


                options:{ responsive: true,
                    plugins:{
            legend:{display: false}},
                    scales:{y:{min:50, max:100}}
                }
},
)

const myChart6=new Chart(document.getElementById("recent287"),


{           type:'line',
            data:{
                labels:exams,
                datasets:[
                            {data:Soen287grade,borderColor:'purple'},
                            

                ]},


                options:{ responsive: true,
                    plugins:{
            legend:{display: false}},
                    scales:{y:{min:50, max:100}}
                }
},
)
const myChart7=new Chart(document.getElementById("recent228"),


{           type:'line',
            data:{
                labels:exams,
                datasets:[
                            {data:comp228grade,borderColor:'green'},
                            

                ]},


                options:{ responsive: true,
                    plugins:{
            legend:{display: false}},
                    scales:{y:{min:50, max:100}}
                }
},
)
const myChart8=new Chart(document.getElementById("recent231"),


{           type:'line',
            data:{
                labels:exams,
                datasets:[
                            {data:engr231grade,borderColor:'black'},
                            

                ]},


                options:{ responsive: true,
                    plugins:{
            legend:{display: false}},
                    scales:{y:{min:50, max:100}}
                }
},
)


const coursename1 =["comp248","comp249","Soen 287","Comp 228","Engr 231"];
const progression = [35,40,70,55,20]
const max1 = [100,100,100,100,100]
const colors1=['blue','red','purple','yellow','black']

const mychart1=new Chart(document.getElementById("chartprogression"),
    {
        type:'bar',
        data:{ 
            labels:coursename1,
            datasets:[{
                data:progression,
                backgroundColor:colors1,
                stack: 'stack1'
            

            },{data:max1,backgroundColor:'grey',stack: 'stack1'}]
        },


        options:{
            responsive: true,
            plugins:{
            legend:{display: false},
            title:{display:true,
                    text:'progression up to date',
            }},

            scales: {
        x: { stacked: true },
        y: { stacked: true, beginAtZero: true, max: 100 }
    }

        }
    }



    )

    




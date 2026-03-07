const coursename =["comp248","comp249","Soen 287","Comp 228","Engr 231"];
const grades = [84,75,68,88,93]
const max = [100,100,100,100,100]
const colors=['blue','red','purple','yellow','black']

const mychart2 =new Chart(document.getElementById("chart"),
    {
        type:'bar',
        data:{ 
            labels:coursename,
            datasets:[{
                data:grades,
                backgroundColor:colors,
                
                
            

            },]
        },


        options:{
            plugins:{
            legend:{display: false},
            title:{display:true,
                    text:'average per course',
            }},
             
    }
}



    )

    




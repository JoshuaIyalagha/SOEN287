const coursename2 =["comp248","comp249","Soen 287","Comp 228","Engr 231"];
const inprogress = [2,4,1,2,4]
const completed = [5,8,4,6,10]
const notstarted=[3,2,5,6,3]
const colors2=['yellow']
const colors3=['green']
const colors4=['red']


const mychart3=new Chart(document.getElementById("assignements"),
    {
        type:'bar',
        data:{ 
            labels:coursename2,
            datasets:[{
                data:inprogress,
                backgroundColor:colors2,
                stack: 'stack1'
            

            },{data:completed,backgroundColor:colors3,stack: 'stack1'},
            {data:notstarted,backgroundColor:colors4,stack:'stack1'}]
        },


        options:{
            indexAxis:'y',
            responsive: true,
            plugins:{
            legend:{display: false},
            title:{display:true,
                    text:'tracking of assignements',
            }},

            scales: {
        x: { stacked: true },
        y: { stacked: true, beginAtZero: true, max: 16 }
    }

        }
    }



    )
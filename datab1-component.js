const template = document.createElement('template');

let url = "https://webdictaat.aii.avans.nl/apis/databases/assignments/";
//let url = "https://localhost:5001/assignments/";

template.innerHTML = `
    <style>
        .container {
            display:flex;
            flex-direction: column;        
            max-width:800px;
            border:1px solid black;
            padding:5px;
        }

        textarea {
            min-height:100px;
            max-width:100%;
            min-width:100%;
            padding:5px;
        }

        h2 {
            margin:0;
        }

        .toggle {
            color: #00AEED;
            padding: 4px 15px;
            font-size: 10px;
            background-color:transparent;
            border:none;
            border-radius:4px;
            text-align:left;
        }

        .toggle:hover {
            cursor:pointer;
            background-color:#eee;
        }

        .feedback 
        {
            color: rgba(255,255,255, 0.84);
            padding:10px;
            margin:5px;
        }

        .feedback.pending {
            background-color: #2e2e2e;

        }

        .feedback.correct {
            background-color: #5cb85c;

        }


        .feedback.wrong {
            background-color: #f0ad4e;

        }

        .feedback span {
            font-weight: bold;
        }

        .feedback p {
            margin:0;
        }


    </style>
`;

class Datab1 extends HTMLElement {
    constructor(){
        super();

        this.api = new DatabApi();

        const shadowRoot = this.attachShadow({mode: 'closed'});
        shadowRoot.appendChild(template.content.cloneNode(true));
        this.aid = this.getAttribute('aid')
        this.uid = this.api.getUserIdFromLocalStorage();

        let root = document.createElement('div');
        root.className = 'container';
        shadowRoot.appendChild(root);

        //Get and draw assignment
        let a_root = document.createElement('div')
        a_root.className = 'container';

        this.drawAssignment(a_root)
        this.api.getAssignment(this.aid).then(assignment => {
            this.drawAssignment(a_root, assignment);
        })

        //Getand draw submission
        let s_root = document.createElement('div')
        s_root.className = 'container';

        this.drawSubmission(s_root)
        this.api.getSubmission(this.aid, this.uid).then(submission => {
            this.drawSubmission(s_root, submission);
        })

        root.appendChild(a_root);
        root.appendChild(s_root);

       
    }

    drawAssignment(container, assignment){

        container.innerHTML = "";

        if(!assignment)
        {        
            let loader = document.createElement('p');
            loader.innerText  = "Loading...";
            container.appendChild(loader);
            return;
        }

        //title
        let h2 = document.createElement('h2');
        h2.innerText = assignment.title;

        //description
        let p = document.createElement('p');
        p.innerText = assignment.description;

        let output = document.createElement('div');
        output.style.display = 'none';
        output.innerHTML = assignment.expectedOutput;

        //toggle button
        let show = false;
        let toggle = document.createElement('button');
        toggle.className = 'toggle';
        toggle.innerText = "SHOW EXPECTED OUTPUT";
        toggle.addEventListener('click', () => {
            show = !show;
            output.style.display = show ? '' : 'none';
        });

        container.appendChild(h2);
        container.appendChild(p);
        container.appendChild(toggle);
        container.appendChild(output);


    }

    drawSubmission(container, submission){

        container.innerHTML = "";

        if(!submission)
        {        
            let loader = document.createElement('p');
            loader.innerText  = "Loading...";
            container.appendChild(loader);
            return;
        }

        //input
        let input = document.createElement('textarea');


        let feedback = document.createElement('div');

        if(submission.query)
        {
            //complete
            let span = document.createElement("span")
            let p = document.createElement("p")
            input.value = submission.query;
            
            switch(submission.statusId){
                case 0: {
                    feedback.className = "feedback pending";
                    span.innerText = "Pending!";
                    p.innerText = "We are checking your code...";
                };break;
                case 1:{
                    feedback.className = "feedback correct";
                    span.innerText = "Well done!";
                    p.innerText = "You completed this assignment on " + new Date(submission.timestamp).toDateString()
                };break;
                default: {
                    feedback.className = "feedback wrong";
                    span.innerText = "Oh snap!";
                    p.innerText = submission.message;
                    p.innerText += "/r /r Change a few things up and try submitting again." 
                };
            }

            feedback.appendChild(span);
            feedback.appendChild(p);
        }

    

        //submit
        let submit = document.createElement('button');
        submit.className = 'submit';
        submit.innerText = 'Submit';
        submit.addEventListener('click', () => {
            let query = input.value;
            this.api.sendSubmission(this.aid, this.uid, query).then(submission => {
                this.drawSubmission(container, submission)
                this.pollSubmission(container, submission, 5);
            })
        })
                  
        container.appendChild(input);
        container.appendChild(submit);
        container.appendChild(feedback);
    }

    pollSubmission(container, submission, ticker){
        setTimeout(() => {
            this.api.getSubmission(this.aid, this.uid).then(sub => {
      
                if(sub.statusId != 0)
                    this.drawSubmission(container, sub);
                else if(ticker >= 0)
                    this.pollSubmission(container, submission, ticker-1)

            })
        }, 2000);
    }


}

class DatabApi
{

    getAssignment(aid){
        return fetch(url + aid)
            .then(res => res.json());
    }

    getSubmission(aid, uid){
        return fetch(url + aid + '/submissions/' + uid)
            .then(res => {
                return res.status == 204 ? {} : res.json()
            });
    }

    getUserIdFromLocalStorage(){
       let uid = localStorage.getItem('Session.UserId');

       if(!uid){
           uid = Math.round(Math.random() * 999999);
        localStorage.setItem('Session.UserId', uid);
       }

       return uid;
    }

    sendSubmission(aid, uid, query){
        console.log(query);
        return fetch(url + aid + '/submissions/' , { 
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                email: uid,
                query: query
            })
        }).then(res => res.json())
    }
}

window.customElements.define('wd-datab1', Datab1);

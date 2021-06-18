const template = document.createElement('template');

let url = "https://webdictaat.aii.avans.nl/apis/databases/assignments/"

class Datab1 extends HTMLElement {
    constructor(){
        super();
        const shadowRoot = this.attachShadow({mode: 'closed'});
        this.draw(shadowRoot)

        this.aid = this.getAttribute('aid')
        this.getAssignment().then(data => {
            this.draw(shadowRoot, data);
        })
       
    }

    getAssignment(){
        return fetch(url + this.aid)
            .then(res => res.json());
    }

    draw(root, data){
        if(!data)
        {
            root.innerHtlm  = "<p>Loading...</p>";
        }
        else 
        {
            let h2 = document.createElement('h2');
            h2.innerText = 'Assignment: ' + this.aid;

            let output = document.createElement('div');
            output.innerHTML = data.expectedOutput;

            let container = document.createElement('div');
            container.appendChild(h2);
            container.appendChild(output);

            root.appendChild(container);
        }
    }
}

window.customElements.define('wd-datab1', Datab1);
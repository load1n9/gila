class GilaTokenizer {
    tokens = [];
    pointer = 0;
    data = [];
    constructor(text){
        this.data = text.split("");
        this.tokenize();
    }
    tokenize() {
        while(this.pointer < this.data.length){
            switch(this.data[this.pointer]){
                case "*":
                    if (this.data[this.pointer + 1] === "*") {
                        this.pointer += 2;
                        this.tokens.push(this.parseBold());
                    } else {
                        this.pointer++;
                        this.tokens.push(this.parseItalic());
                    }
                    break;
                case "[":
                    this.pointer++;
                    this.tokens.push(this.parseLink());
                    break;
                case "~":
                    if (this.data[this.pointer + 1] === "~") {
                        this.pointer += 2;
                        this.tokens.push(this.parseStrike());
                    }
                    break;
                default:
                    this.tokens.push({
                        type: "text",
                        content: this.data[this.pointer]
                    });
                    this.pointer++;
                    break;
            }
        }
    }
    parseItalic() {
        let output = "";
        while(this.pointer < this.data.length && !this.data[this.pointer].includes("*")){
            output += this.data[this.pointer];
            this.pointer++;
        }
        this.pointer++;
        return {
            type: "italic",
            content: output
        };
    }
    parseLink() {
        let output = "";
        let link = "";
        while(this.pointer < this.data.length && !this.data[this.pointer].includes("]")){
            output += this.data[this.pointer];
            this.pointer++;
        }
        this.pointer += 2;
        while(this.pointer < this.data.length && !this.data[this.pointer].includes(")")){
            link += this.data[this.pointer];
            this.pointer++;
        }
        this.pointer++;
        return {
            type: "link",
            content: output,
            href: link
        };
    }
    parseBold() {
        let output = "";
        while(this.pointer < this.data.length && !this.data[this.pointer].includes("*")){
            output += this.data[this.pointer];
            this.pointer++;
        }
        this.pointer += 2;
        return {
            type: "bold",
            content: output
        };
    }
    parseStrike() {
        let output = "";
        while(this.pointer < this.data.length && !this.data[this.pointer].includes("~")){
            output += this.data[this.pointer];
            this.pointer++;
        }
        this.pointer += 2;
        return {
            type: "strikethrough",
            content: output
        };
    }
}
const GilaTokenizer1 = GilaTokenizer;
class GilaParser {
    output = "";
    constructor(tokens){
        this.tokens = tokens;
        this.parse();
    }
    parse() {
        this.tokens.forEach((token)=>{
            switch(token.type){
                case "text":
                    this.output += token.content;
                    break;
                case "bold":
                    this.output += `<strong>${token.content}</strong>`;
                    break;
                case "italic":
                    this.output += `<i>${token.content}</i>`;
                    break;
                case "strikethrough":
                    this.output += `<div style="text-decoration: line-through;">${token.content}</div>`;
                    break;
                case "link":
                    this.output += `<a href="${token.href}">${token.content}</a>`;
                    break;
            }
        });
        this.output = `<div>${this.output}</div>`;
    }
}
const GilaParser1 = GilaParser;
let dir = [
    {
        input: ":smile:",
        output: "1F600"
    },
    {
        input: ":blush:",
        output: "263A"
    },
    {
        input: ":kiss:",
        output: "1F619"
    },
    {
        input: ":tongue:",
        output: "1F61B"
    },
    {
        input: ":frown:",
        output: "2639"
    }
];
let svg = [
    {
        input: ":github:",
        output: `<i class="bi-github"></i>`
    },
    {
        input: ":discord:",
        output: `<i class="bi-discord"></i>`
    }
];
class EmoteParser {
    constructor(text1){
        this.output = text1;
        dir.forEach((e)=>{
            this.output = this.output.replace(e.input, `&#x${e.output}`);
        });
        svg.forEach((e)=>{
            this.output = this.output.replace(e.input, e.output);
        });
    }
}
const EmoteParser1 = EmoteParser;
class GilaMarkdown2 {
    constructor(text2){
        this.tokenizer = new GilaTokenizer1(text2);
        this.parser = new GilaParser1(this.tokenizer.tokens);
        this.emotes = new EmoteParser1(this.parser.output);
    }
    init() {
        return this.emotes.output
    }
}
const GilaMarkdown1 = GilaMarkdown2;
module.exports = GilaMarkdown1

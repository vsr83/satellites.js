import { IOption, OptionType, Configuration, ConfigurationData } from "./Configuration";

export class ConfigurationView {
    constructor(configuration : Configuration) {
        this.configuration = configuration;
    }

    setElement(parentElementId : string) {
        this.parentElement = <HTMLElement> document.getElementById(parentElementId);
    }

    createElements() {
        console.log("createElements");

        const configurationData : ConfigurationData = this.configuration.getData();

        console.log(configurationData);

        const keyList = Object.keys(configurationData);
        
        for (let indKey = 0; indKey < keyList.length; indKey++) {
            const optionDiv : HTMLElement = document.createElement("div");
            optionDiv.setAttribute("class", "configuration_div");
            this.parentElement.appendChild(optionDiv);

            const key : string = keyList[indKey];
            const option : IOption = configurationData[key];

            if (option.optionType == OptionType.OPTION_BOOLEAN) 
            {
                this.addBoolean(key, option, this.parentElement);
            }
            else if (option.optionType == OptionType.OPTION_RANGE_FLOAT)
            {
                this.addFloatRange(key, option, this.parentElement);
            }
            else if (option.optionType == OptionType.OPTION_STRING)
            {
                this.addString(key, option, this.parentElement);
            }
        }
    }

    addBoolean(key : string, option : IOption, parentElement : HTMLElement) {
        const optionDiv : HTMLElement = document.createElement("div");
        optionDiv.setAttribute("class", "configuration_div");
        this.parentElement.appendChild(optionDiv);

        const checkBox : HTMLInputElement = document.createElement("input");
        checkBox.setAttribute("type", "checkbox");
        checkBox.setAttribute("id", "configuration_" + key);
        checkBox.setAttribute("name", key);
        checkBox.checked = <boolean> option.booleanValue;
        checkBox.addEventListener('change', function() {
            option.booleanValue = this.checked;
        });

        const label : HTMLElement = document.createElement("label");

        label.addEventListener('click', function() {
            checkBox.checked = !option.booleanValue;
            option.booleanValue = checkBox.checked;
        });

        label.setAttribute("for", key);
        const textNode = document.createTextNode(option.caption);
        label.appendChild(textNode);
        optionDiv.appendChild(checkBox);
        optionDiv.appendChild(label);
    }

    addFloatRange(key : string, option : IOption, parentElement : HTMLElement) {
        const optionDiv : HTMLElement = document.createElement("div");
        optionDiv.setAttribute("class", "configuration_div");
        parentElement.appendChild(optionDiv);

        const range : HTMLInputElement = document.createElement("input");

        const nSteps = Math.floor((<number> option.maxValue - <number> option.minValue) 
                     / <number> option.stepSize);
        range.value = <string> option.numberValue?.toString();
        range.setAttribute("type", "range");
        range.setAttribute("min", <string> (<number> option.minValue).toString());
        range.setAttribute("max", <string> (<number> option.maxValue).toString());
        range.setAttribute("step", (<number>option.stepSize).toString());//nSteps.toString())
        range.setAttribute("id", "configuration_" + key);
        range.setAttribute("name", key);
        range.setAttribute("class", "configuration_slider");
        range.checked = <boolean> option.booleanValue;

        const label : HTMLElement = document.createElement("label");

        label.setAttribute("for", key);
        const textNode = document.createTextNode(option.caption);
        label.appendChild(textNode);
        optionDiv.appendChild(label);
        optionDiv.appendChild(range);

        const textEdit : HTMLTextAreaElement = document.createElement("textarea");
        textEdit.setAttribute("class", "configuration_slider_textarea");
        textEdit.setAttribute("rows", "1");
        textEdit.setAttribute("maxlength", "6");
        textEdit.setAttribute("id", "configuration_range_textarea_" + key);
        textEdit.innerText = range.value;
        range.addEventListener('input', function() {
            option.numberValue = parseFloat(range.value);
            textEdit.value = range.value;
        });
        textEdit.addEventListener('change', function() {
            let value : number = parseFloat(textEdit.value);
            if (isNaN(value)) {
                textEdit.value = range.value;
            }
            else 
            {
                if (value > <number> option.maxValue) 
                {
                    value = <number> option.maxValue;
                    textEdit.value = value.toString();
                }
                if (value < <number> option.minValue) 
                {
                    value = <number> option.minValue;
                    textEdit.value = value.toString();
                }
                range.value = value.toString();
            }
            option.numberValue = parseFloat(range.value);
        });
        optionDiv.appendChild(textEdit);
    }

    addString(key : string, option : IOption, parentElement : HTMLElement) {
        const optionDiv : HTMLElement = document.createElement("div");
        optionDiv.setAttribute("class", "configuration_div");
        parentElement.appendChild(optionDiv);

        const label : HTMLElement = document.createElement("label");
        const textNode = document.createTextNode(option.caption);
        label.appendChild(textNode);
        optionDiv.appendChild(label);

        const textEdit : HTMLTextAreaElement = document.createElement("textarea");
        textEdit.setAttribute("class", "configuration_string_textarea");
        textEdit.setAttribute("rows", "1");
        textEdit.setAttribute("maxlength", "6");
        textEdit.setAttribute("id", "configuration_string_textarea_" + key);
        textEdit.value = <string> option.stringValue;
        textEdit.addEventListener('change', function() {
            let value : number = parseFloat(textEdit.value);
        });
        optionDiv.appendChild(textEdit);
    }


    configuration : Configuration;

    parentElement : HTMLElement;
}
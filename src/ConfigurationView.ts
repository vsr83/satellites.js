import { IOption, OptionType, Configuration, ConfigurationData, OptionLayout } from "./Configuration";

/**
 * Class implementing configuration view.
 */
export class ConfigurationView {
    /**
     * Public constructor.
     * 
     * @param {Configuration} configuration 
     *      Configuration used by the view.
     */
    constructor(configuration : Configuration) {
        this.configuration = configuration;
    }

    /**
     * Set the parent element for the view.
     */
    setElement(parentElementId : string) {
        this.parentElement = <HTMLElement> document.getElementById(parentElementId);
    }

    /**
     * Generate content for the view based on a layout.
     * 
     * @param {OptionLayout[]} layout 
     *      Array of configuration groups.
     */
    parseLayout(layout : OptionLayout[]) {
        const configurationData : ConfigurationData = this.configuration.getData();

        const keyList = Object.keys(configurationData);
        
        for (let indGroup = 0; indGroup < layout.length; indGroup++) {
            const object : OptionLayout = layout[indGroup];

            const button : HTMLElement = document.createElement("button");
            const textNode = document.createTextNode(object["title"]);
            button.setAttribute("class", "configuration_collapsible");
            button.appendChild(textNode);
            this.parentElement.appendChild(button);

            console.log("Processing " + object["title"]);

            const div : HTMLElement = document.createElement("div");
            this.parentElement.appendChild(div);

            button.addEventListener("click", function() {
                if (div.style.visibility != "hidden"){
                    div.style.visibility = "hidden";
                    div.style.maxHeight = "0px";
                    button.classList.toggle("configuration_collapsible_active");
                } else {
                    div.style.visibility = "visible";
                    div.style.maxHeight = div.scrollHeight + "px";
                    button.classList.remove("configuration_collapsible_active");
                } 
            });

            for (let indOption = 0; indOption < object["options"].length; indOption++) {
                const key : string = object["options"][indOption];
                const option : IOption = configurationData[key];
    
                this.createElement(key, option, div);

                console.log(key);
            }

        }
    }

    /**
     * Add elements for one configuration parameter.
     * 
     * @param {string} key 
     *      Key for the configuration parameter.
     * @param {IOption} option 
     *      Parameters for the view regarding one configuration parameter.
     * @param {HTMLElement} div 
     *      The parent element for the view of the option.
     */
    createElement(key : string, option : IOption, div : HTMLElement) {
        if (option.optionType == OptionType.OPTION_BOOLEAN) 
        {
            this.addBoolean(key, option, div);
        }
        else if (option.optionType == OptionType.OPTION_RANGE_FLOAT)
        {
            this.addFloatRange(key, option, div);
        }
        else if (option.optionType == OptionType.OPTION_STRING)
        {
            this.addString(key, option, div);
        }
        else if (option.optionType == OptionType.OPTION_SELECT) 
        {
            this.addOptions(key, option, div);
        }
    }

    /**
     * Add boolean-valued option.
     * 
     * @param {string} key
     *      Option key. 
     * @param {IOption} option 
     *      Option data.
     * @param {HTMLElement} parentElement 
     *      Parent HTML element.
     */
    addBoolean(key : string, option : IOption, parentElement : HTMLElement) {
        const optionDiv : HTMLElement = document.createElement("div");
        optionDiv.setAttribute("class", "configuration_div");
        parentElement.appendChild(optionDiv);

        const checkBox : HTMLInputElement = document.createElement("input");
        checkBox.setAttribute("type", "checkbox");
        checkBox.setAttribute("id", "configuration_" + key);
        checkBox.setAttribute("name", key);
        checkBox.checked = <boolean> option.booleanValue;
        checkBox.addEventListener('change', function() {
            option.booleanValue = this.checked;
        });

        const label : HTMLElement = document.createElement("label");
        label.setAttribute("class", "configuration_label");

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

    /**
     * Add multiple-choice option.
     * 
     * @param {string} key
     *      Option key. 
     * @param {IOption} option 
     *      Option data.
     * @param {HTMLElement} parentElement 
     *      Parent HTML element.
     */
    addOptions(key : string, option : IOption, parentElement : HTMLElement) {
        const optionDiv : HTMLElement = document.createElement("div");
        optionDiv.setAttribute("class", "configuration_div");
        parentElement.appendChild(optionDiv);

        const label : HTMLElement = document.createElement("label");
        label.setAttribute("class", "configuration_label");
        label.setAttribute("for", key);
        optionDiv.appendChild(label);
        const textNode = document.createTextNode(option.caption);
        label.appendChild(textNode);

        const select : HTMLSelectElement = document.createElement("select");
        select.setAttribute("id", "configuration_option_" + key);
        select.setAttribute("name", key);
        optionDiv.appendChild(select);

        const optionList : string[] = <string[]> option.optionList;
        console.log(optionList);

        for (let indOption = 0; indOption < optionList.length; indOption++) 
        {
            const optionName : string = optionList[indOption];
            const optionElem : HTMLOptionElement = document.createElement("option");
            optionElem.setAttribute("value", optionName);
            select.appendChild(optionElem);
            const textNode = document.createTextNode(optionName);
            optionElem.appendChild(textNode);
        }

        select.addEventListener("change", function() {
            option.stringValue = select.value;
        });
    }

    /**
     * Add floating point-valued option.
     * 
     * @param {string} key
     *      Option key. 
     * @param {IOption} option 
     *      Option data.
     * @param {HTMLElement} parentElement 
     *      Parent HTML element.
     */
    addFloatRange(key : string, option : IOption, parentElement : HTMLElement) {
        const optionDiv : HTMLElement = document.createElement("div");
        optionDiv.setAttribute("class", "configuration_div");
        parentElement.appendChild(optionDiv);

        console.log("addFloatRange");
        console.log(parentElement);

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
        label.setAttribute("class", "configuration_label");
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

    /**
     * Add string-valued option.
     * 
     * @param {string} key
     *      Option key. 
     * @param {IOption} option 
     *      Option data.
     * @param {HTMLElement} parentElement 
     *      Parent HTML element.
     */
    addString(key : string, option : IOption, parentElement : HTMLElement) {
        const optionDiv : HTMLElement = document.createElement("div");
        optionDiv.setAttribute("class", "configuration_div");
        parentElement.appendChild(optionDiv);

        const label : HTMLElement = document.createElement("label");
        label.setAttribute("class", "configuration_label");
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

    // Configuration.
    configuration : Configuration;

    // HTML parent element.
    parentElement : HTMLElement;
}
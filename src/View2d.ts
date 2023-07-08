import { IVisibility } from "./IVisibility";

export class View2d implements IVisibility
{
    // HTML element for 2d canvas.
    private canvas2d : HTMLCanvasElement;
    // HTML element for the WebGL2 canvas.
    private canvasGl : HTMLCanvasElement;
    // HTML element for the container.
    private container : HTMLElement;

    // Earth map polygons.
    private mapPolygons : number[][][];

    /**
     * Public constructor.
     */
    constructor()
    {

    }

    /**
     * Set view DOM elements.
     * 
     * @param {HTMLElement} container 
     *      HTML element for the contained element.
     * @param canvas2d 
     *      HTML element for the 2d canvas.
     * @param canvasGl 
     *      HTML element for the WebGL canvas.
     */
    setElements(
        container : string,
        canvas2d : string,
        canvasGl : string)
    {
        function getElement(id : string) : HTMLElement
        {
            const elem : HTMLElement | null = document.getElementById(id);
            if (elem === null)
            {
                throw Error("Element \"" + id + "\" not found!");
            }

            return elem;
        }

        try
        {
            this.container = <HTMLElement> getElement(container);
            this.canvas2d = <HTMLCanvasElement> getElement(canvas2d);
            this.canvasGl = <HTMLCanvasElement> getElement(canvasGl);
        }
        catch (E : any)
        {
            throw E;
        }
    }

    /**
     * Load map JSON.
     */
    loadMapJson(url : string)
    {
        let polygons : number[][][] =  [];
        this.mapPolygons = polygons;

        const instance = this;

        var xmlHTTP = new XMLHttpRequest();
        xmlHTTP.onreadystatechange = function()
        {
            console.log("readyState: " + this.readyState);
            console.log("status:     " + this.status);
        
            if (this.readyState == 4 && this.status == 200)
            {
                // Parse JSON and initialize World map.
                let dataJSON = JSON.parse(this.responseText);
                console.log(dataJSON);

                var features = dataJSON.features;
                var numPointsTotal = 0;
        
                for (var index = 0; index < features.length; index++)
                {
                    // Read polygons and multi-polygons.
                    var feature = features[index];
                    var geometry = feature.geometry;
                    
                    if (geometry.type === "Polygon")
                    {
                        const coordinates = geometry.coordinates[0];
                        const numPoints = geometry.coordinates[0].length;
                        polygons.push(coordinates);
                        numPointsTotal += numPoints;
                    }
                    if (geometry.type === "MultiPolygon")
                    {
                        var numPolygons = geometry.coordinates.length;
        
                        for (var indPolygon = 0; indPolygon < numPolygons; indPolygon++)
                        {
                            const coordinates = geometry.coordinates[indPolygon][0];
                            polygons.push(coordinates);
                            numPointsTotal += coordinates.length;
                        }
                    }
                }
                console.log("Added " + numPointsTotal + " points");
            }
        }
        xmlHTTP.open("GET", url, true);
        xmlHTTP.send();
    }

    /**
     * Show the view.
     */
    show() : void
    {
        this.container.style.visibility = "visible";
    }

    /**
     * Hide the view.
     */
    hide() : void 
    {
        this.container.style.visibility = "hidden";
    }

    /**
     * Whether the view is visible.
     * 
     * @returns {boolean} Visibility.
     */
    isVisible(): boolean 
    {
        return (this.container.style.visibility === "visible");
    }
}
import 'mocha';
import {AssertionError, strict as assert} from 'assert';
import {Tle} from '../src/Tle';
import { Sgp4Propagation } from '../src/TlePropagators';
import {readFileSync} from 'fs';

describe('Target', function() {
    it('TargetCollection', function() {

        const tle : Tle = Tle.fromLines([
            //"CALSPHERE 2             ",
            //"1 00902U 64063E   23160.93371630  .00000034  00000+0  37960-4 0  9999",
            //"2 00902  90.2056  51.0552 0018078 184.0216 187.9520 13.52752269707108"
            "CALSPHERE 1             ",
            "1 00900U 64063C   23161.95522785  .00000702  00000+0  73232-3 0  9992",
            "2 00900  90.1903  47.7368 0028440  26.7560 344.5702 13.74340666919893"
        ]);
        console.log(tle);
        console.log(tle.toLines());
        console.log(Tle.parseEpoch(tle.epochYear, tle.epochFracDay));

        const sgp4 : Sgp4Propagation = new Sgp4Propagation(tle);
        sgp4.initialize();
        sgp4.compute(1000.0);
    });

    it('parseEpoch', function() {
        /*assert.equal(Tle.parseEpoch(2000, 30).month, 0);
        assert.equal(Tle.parseEpoch(2000, 31).month, 1);
        assert.equal(Tle.parseEpoch(2000, 31+28).month, 1);
        assert.equal(Tle.parseEpoch(2000, 31+29).month, 2);
        assert.equal(Tle.parseEpoch(2000, 31+29+30).month, 2);
        assert.equal(Tle.parseEpoch(2000, 31+29+31).month, 3);*/
        //Tle.parseEpoch();
    });

    it('CelesTrak', function() {
        const content = readFileSync("data/active.txt").toString().split("\n");
        const numElem = content.length / 3;

        console.log(numElem);

        for (let indElem = 0; indElem < numElem - 1; indElem++)
        {
            const lines : string[] = [
                content[indElem * 3].slice(0, -1),
                content[indElem * 3 + 1].slice(0, -1),
                content[indElem * 3 + 2].slice(0, -1)
            ];
            
            //console.log(indElem)
            //console.log(lines);
            const tle : Tle = Tle.fromLines(lines);
            const linesOut = tle.toLines();
            //console.log(tle.toLines());
            assert.equal(lines[0], linesOut[0]);
            assert.equal(lines[1], linesOut[1]);
            assert.equal(lines[2], linesOut[2]);
            /*if (!(lines[1] === linesOut[1]))
            {
                console.log(lines[1]);
                console.log(linesOut[1]);
            }
            if (!(lines[2] === linesOut[2]))
            {
                console.log(lines[2]);
                console.log(linesOut[2]);
            }*/
        }

    });
});
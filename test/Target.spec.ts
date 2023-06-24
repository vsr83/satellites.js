import 'mocha';
import {AssertionError, strict as assert} from 'assert';
import {TargetInfoField, TargetInfo, TargetInfoCollection, TargetCollection} from '../src/Target';

describe('Target', function() {
    it('TargetCollection', function() {

        const sat1 = {
            "OBJECT_NAME":"CALSPHERE 1",
            "OBJECT_ID":"1964-063C",
            "EPOCH":"2023-05-30T13:06:17.182944",
        };
        const sat2 = {
            "OBJECT_NAME":"CALSPHERE 2",
            "OBJECT_ID":"1964-063E",
            "EPOCH":"2023-05-30T05:33:51.472800",
        };
        const sat3 = {
            "OBJECT_NAME":"LCS 1",
            "OBJECT_ID":"1965-034C",
            "EPOCH":"2023-05-30T11:36:51.334272",
        };
        const sat4 = {
            "OBJECT_NAME":"TEMPSAT 1",
            "OBJECT_ID":"1965-065E",
            "EPOCH":"2023-05-30T04:57:15.831072"
        };
        const sat5 = {
            "OBJECT_NAME":"CALSPHERE 4A",
            "OBJECT_ID":"1965-065H",
            "EPOCH":"2023-05-30T10:36:32.764032",
        };
        const satBroken = {
            "OBJECT_NAME":"CALSPHERE 4A",
            "EPOCH":"2023-05-30T10:36:32.764032",
        };

        const collection : TargetCollection = new TargetCollection("OBJECT_ID");
        assert.equal(collection.getLength(), 0);
        collection.addTarget(sat1);
        assert.equal(collection.getLength(), 1);
        collection.addTarget(sat2);
        assert.equal(collection.getLength(), 2);
        collection.addTarget(sat3);
        assert.equal(collection.getLength(), 3);
        collection.addTarget(sat4);
        assert.equal(collection.getLength(), 4);
        collection.addTarget(sat5);
        assert.equal(collection.getLength(), 5);
        assert.throws(() => {collection.addTarget(satBroken)}, Error);        
        assert.throws(() => {collection.addTarget(sat5)}, Error);

        assert.equal(collection.getKey(sat1), sat1["OBJECT_ID"]);
        assert.equal(collection.getKey(sat2), sat2["OBJECT_ID"]);
        assert.equal(collection.getKey(sat3), sat3["OBJECT_ID"]);
        assert.equal(collection.getKey(sat4), sat4["OBJECT_ID"]);
        assert.equal(collection.getKey(sat5), sat5["OBJECT_ID"]);

        assert.equal(collection.containsKey(sat1["OBJECT_ID"]), true);
        assert.equal(collection.containsKey(sat2["OBJECT_ID"]), true);
        assert.equal(collection.containsKey(sat3["OBJECT_ID"]), true);
        assert.equal(collection.containsKey(sat4["OBJECT_ID"]), true);
        assert.equal(collection.containsKey(sat5["OBJECT_ID"]), true);
        assert.equal(collection.containsTarget(sat1), true);
        assert.equal(collection.containsTarget(sat2), true);
        assert.equal(collection.containsTarget(sat3), true);
        assert.equal(collection.containsTarget(sat4), true);
        assert.equal(collection.containsTarget(sat5), true);
        assert.equal(collection.containsKey("dummy"), false);

        assert.equal(collection.getTarget(sat1["OBJECT_ID"]), sat1);
        assert.equal(collection.getTarget(sat2["OBJECT_ID"]), sat2);
        assert.equal(collection.getTarget(sat3["OBJECT_ID"]), sat3);
        assert.equal(collection.getTarget(sat4["OBJECT_ID"]), sat4);
        assert.equal(collection.getTarget(sat5["OBJECT_ID"]), sat5);
        assert.throws(() => {collection.getTarget("dummy")}, Error);

        assert.throws(() => {collection.removeTarget("dummy")}, Error);
        assert.equal(collection.getLength(), 5);
        collection.removeTarget(collection.getKey(sat1));
        assert.equal(collection.getLength(), 4);
        assert.equal(collection.containsKey(collection.getKey(sat1)), false);
        assert.equal(collection.containsKey(collection.getKey(sat2)), true);
        assert.equal(collection.containsKey(collection.getKey(sat3)), true);
        assert.equal(collection.containsKey(collection.getKey(sat4)), true);
        assert.equal(collection.containsKey(collection.getKey(sat5)), true);
        assert.equal(collection.containsTarget(sat1), false);
        assert.equal(collection.containsTarget(sat2), true);
        assert.equal(collection.containsTarget(sat3), true);
        assert.equal(collection.containsTarget(sat4), true);
        assert.equal(collection.containsTarget(sat5), true);

        const keys = collection.getKeys();
        assert.equal(keys.includes(sat1["OBJECT_ID"]), false);
        assert.equal(keys.includes(sat2["OBJECT_ID"]), true);
        assert.equal(keys.includes(sat3["OBJECT_ID"]), true);
        assert.equal(keys.includes(sat4["OBJECT_ID"]), true);
        assert.equal(keys.includes(sat5["OBJECT_ID"]), true);

        const targets = collection.getTargets();
        assert.equal(targets.length, 4);
        
        collection.removeTarget(collection.getKey(sat2));
        assert.equal(collection.getLength(), 3);
        collection.removeTarget(collection.getKey(sat3));
        assert.equal(collection.getLength(), 2);
        collection.removeTarget(collection.getKey(sat4));
        assert.equal(collection.getLength(), 1);
        collection.removeTarget(collection.getKey(sat5));
        assert.equal(collection.getLength(), 0);

    });
});
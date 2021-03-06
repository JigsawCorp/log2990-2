import { expect } from "chai";
import { ICommon3DPosition } from "../../../../../common/model/positions";
import { NoErrorThrownException } from "../../../tests/noErrorThrownException";
import { RandomGrid } from "./randomGrid";

describe("RandomGrid", () => {
    describe("generateGrid()", () => {
        it("Should generate a grid with a bunch of random positions 200 minimum", () => {
            const SIZE: number = 1000;
            const DEPTH: number = 50;
            const MARGIN: number = 20;
            const POSITION_TO_GENERATE: number = 200;
            const randomGrid: RandomGrid = new RandomGrid({x: SIZE, y: SIZE, z: DEPTH}, MARGIN);

            // tslint:disable-next-line:no-magic-numbers
            const minX: number = SIZE / 2  * -1;
            // tslint:disable-next-line:no-magic-numbers
            const minY: number = SIZE / 2  * -1;
            const maxX: number = minX * -1;
            const maxY: number = minY * -1;

            for (let i: number = 0; i < POSITION_TO_GENERATE; i++) {
                const position: ICommon3DPosition = randomGrid.getNextPosition();

                expect(position.x).to.be.gte(minX).and.to.be.lte(maxX);
                expect(position.y).to.be.gte(minY).and.to.be.lte(maxY);
            }
        });

        it("Should return an error if too many positions are requested from the grid", () => {
            const SIZE: number = 1000;
            const MARGIN: number = 20;
            const DEPTH: number = 50;
            const POSITION_TO_GENERATE: number = 500;
            const randomGrid: RandomGrid = new RandomGrid({x: SIZE, y: SIZE, z: DEPTH}, MARGIN);

            try {
                for (let i: number = 0; i < POSITION_TO_GENERATE; i++) {
                    randomGrid.getNextPosition();
                }
                throw new NoErrorThrownException();
            } catch (err) {
                expect(err.message).to.equal("The stack cannot be popped since it's empty.");
            }
        });
        it("Should generate the number of positions requested by the user", () => {
            const SIZE: number = 1000;
            const DEPTH: number = 50;
            const MARGIN: number = 20;
            const POSITION_TO_GENERATE: number = 400;

            const randomGrid: RandomGrid = new RandomGrid({x: SIZE, y: SIZE, z: DEPTH}, MARGIN);
            expect(randomGrid.getPositions().length).to.equal(POSITION_TO_GENERATE);
        });
    });
});

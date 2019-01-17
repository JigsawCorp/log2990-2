import { injectable, inject } from "inversify";
import { Router, Request, Response, NextFunction } from "express";

import Types from "./types";
import { UsernameValidation } from "./routes/verifyUsername";

@injectable()
export class Routes {

    public constructor(@inject(Types.UsernameValidation) private usernameValidation: UsernameValidation) {}

    public get routes(): Router {
        const router: Router = Router();

        router.get("/verifyUser/:username?",
                   (req: Request, res: Response, next: NextFunction) => this.usernameValidation.verifyUsername(req, res, next));

        router.get("/",
                   (req: Request, res: Response, next: NextFunction) => this.index.helloWorld(req, res, next));
        router.post("/differences",
                    (req: Request, res: Response, next: NextFunction) => this.index.postDifference(req, res, next));
        return router;
    }
}

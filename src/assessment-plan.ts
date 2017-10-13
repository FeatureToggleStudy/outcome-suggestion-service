import { LearningOutcome } from './outcome';
import { levels, assessments } from './taxonomy';

export class AssessmentPlan {
    private _source: LearningOutcome;
    get source(): LearningOutcome { return this._source; }

    private _plan: string;
    get plan(): string { return this._plan; }
    set plan(plan: string) {
        if (assessments[this._source.bloom].has(plan)) { this._plan = plan; }
        else throw plan+" is not a valid assessment plan for the "+this._source.bloom+" taxon";
    }

    private _text: string;
    get text(): string { return this._text; }
    set text(text: string) { this._text = text; }

    constructor(source: LearningOutcome) {
        this._source = source;
        this._plan = Array.from(assessments[source.bloom])[0];
        this._text = "";
    }
}
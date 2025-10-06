
export class BaseAI {

    async processUserInput(userMessage) {
        throw new Error("processUserInput() must be implemented in subclass");
    }

}
// A lightweight, AI-focused dice rolling extension for SillyTavern.
// This extension registers a function tool that allows the LLM to roll dice.
// It has no UI and is designed to be called directly by the AI.

// We need to get the context to register our function.
import { getContext }s from '../../../extensions.js';

/**
 * The core dice rolling logic.
 * Uses the droll.js library included with SillyTavern.
 * @param {string} formula The dice formula to roll (e.g., "1d100", "2d6+5").
 * @returns {object|null} A droll result object if valid, otherwise null.
 */
function rollDice(formula) {
    if (typeof formula !== 'string' || !droll.validate(formula)) {
        console.error(`[AI-Dice-Roller] Invalid dice formula provided: ${formula}`);
        return null;
    }
    return droll.roll(formula);
}

/**
 * Registers the function tool for the AI to use.
 */
function registerAiDiceRoller() {
    // First, check if function calling is supported and enabled.
    const context = getContext();
    if (!context.isToolCallingSupported()) {
        console.log("[AI-Dice-Roller] Function calling is not supported or not enabled. The tool will not be registered.");
        return;
    }

    // Define the structure (schema) of the parameters our function will accept.
    const parametersSchema = {
        $schema: 'http://json-schema.org/draft-04/schema#',
        type: 'object',
        properties: {
            formula: {
                type: 'string',
                description: "A standard dice formula, such as '1d100', '3d6', or '1d20+5'. This is used to calculate the result of a random event or a skill check.",
            },
        },
        required: [
            'formula',
        ],
    };

    // Register the tool itself.
    try {
        context.registerFunctionTool({
            // A unique internal name for our function.
            name: "roll_dice_formula",

            // The name displayed in the UI, if any.
            displayName: "AI Dice Roller",

            // CRITICAL: This description tells the AI WHEN to use this function.
            // It needs to be very clear and direct.
            description: `
Use this function to determine the outcome of a random event or a skill check.
You must provide a valid dice formula. The function will return a JSON object containing the total sum and an array of the individual dice rolls.
**For special rolls like Advantage/Disadvantage, you must handle the logic yourself:**
- **Advantage Roll (e.g., on a d20):** Set the formula to '2d20'. Then, from the returned 'rolls' array, you must select the HIGHER value as the final result.
- **Disadvantage Roll (e.g., on a d20):** Set the formula to '2d20'. Then, from the returned 'rolls' array, you must select the LOWER value as the final result.
Example: For an Advantage roll, you call with '2d20'. The tool returns {"total":25,"rolls":[17,8]}. You then state that the result is 17.
`.trim(), // .trim() is good practice to remove leading/trailing whitespace.

            // The JSON schema for the function's parameters.
            parameters: parametersSchema,

            // The actual code that runs when the AI calls the function.
            // It can be async if it needs to wait for something.
            action: async ({ formula }) => {
                const result = rollDice(formula);

                if (result) {
                    // Return the full result object as a JSON string.
                    // This gives the AI more information to work with (total, individual rolls, etc.).
                    return JSON.stringify(result);
                } else {
                    // Inform the AI that the roll failed due to an invalid formula.
                    return `Error: Invalid dice formula "${formula}". Please provide a valid formula like '1d20' or '2d6+3'.`;
                }
            },

            // We don't want a toast message to pop up every time the AI rolls.
            // The AI's own response will serve as the notification.
            // Returning an empty string suppresses the message.
            formatMessage: () => '',

            // Optional: If you want the tool call to be completely hidden from the chat log UI.
            // false (default): Shows "Ran tool: AI Dice Roller" in the chat.
            // true: Hides the tool call message from the chat UI. The AI still gets the result.
            stealth: false,
        });

        console.log("[AI-Dice-Roller] Dice rolling function tool registered successfully.");

    } catch (error) {
        console.error("[AI-Dice-Roller] Failed to register the function tool:", error);
    }
}

// When the SillyTavern UI is ready, run our registration function.
jQuery(function () {
    registerAiDiceRoller();
});

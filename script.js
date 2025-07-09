/* global droll, jQuery */ // <-- 告诉编辑器 droll 和 jQuery 是全局变量

// A lightweight, AI-focused dice rolling extension for SillyTavern.
// This extension registers a function tool that allows the LLM to roll dice.
// It has no UI and is designed to be called directly by the AI.

// We need to get the context to register our function.
import { getContext } from '../../../extensions.js'; // <-- 修正了这里的拼写错误

/**
 * The core dice rolling logic.
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
    const context = getContext();
    if (!context.isToolCallingSupported()) {
        console.log("[AI-Dice-Roller] Function calling is not supported or not enabled. The tool will not be registered.");
        return;
    }

    const parametersSchema = {
        $schema: 'http://json-schema.org/draft-04/schema#',
        type: 'object',
        properties: {
            formula: {
                type: 'string',
                description: "A standard dice formula, such as '1d100', '3d6', or '1d20+5'.",
            },
        },
        required: [
            'formula',
        ],
    };

    try {
        context.registerFunctionTool({
            name: "roll_dice_formula",
            displayName: "AI Dice Roller",
            description: `
Use this function to determine the outcome of a random event or a skill check.
You must provide a valid dice formula. The function will return a JSON object containing the total sum and an array of the individual dice rolls.
**For special rolls like Advantage/Disadvantage, you must handle the logic yourself:**
- **Advantage Roll (e.g., on a d20):** Set the formula to '2d20'. Then, from the returned 'rolls' array, you must select the HIGHER value as the final result.
- **Disadvantage Roll (e.g., on a d20):** Set the formula to '2d20'. Then, from the returned 'rolls' array, you must select the LOWER value as the final result.
Example: For an Advantage roll, you call with '2d20'. The tool returns {"total":25,"rolls":[17,8]}. You then state that the result is 17.
**Efficient Multi-Rolls & Loops:**
- For tasks requiring multiple rolls (e.g., "roll until you succeed"), **DO NOT** call the tool repeatedly for each roll.
- Instead, roll a batch of dice in a single, efficient call (e.g., '10d100').
- Then, process the returned 'rolls' array internally to find the first success or complete the task.
`.trim(),

            parameters: parametersSchema,

            action: async ({ formula }) => {
                const result = rollDice(formula);
                if (result) {
                    return JSON.stringify(result);
                } else {
                    return `Error: Invalid dice formula "${formula}". Please provide a valid formula like '1d20' or '2d6+3'.`;
                }
            },

            formatMessage: () => '',
            stealth: true,
        });

        console.log("[AI-Dice-Roller] Dice rolling function tool registered successfully with updated description for Advantage/Disadvantage.");

    } catch (error) {
        console.error("[AI-Dice-Roller] Failed to register the function tool:", error);
    }
}

// When the SillyTavern UI is ready, run our registration function.
jQuery(function () {
    registerAiDiceRoller();
});

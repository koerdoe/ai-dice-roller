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
            description: `Use this function for dice rolls. It returns a JSON object with 'total' and an array of 'rolls'.

**Advantage/Disadvantage Rolls:**
- **Advantage:** Set formula to '2d20'. You must then use the HIGHER value from the returned 'rolls' array.
- **Disadvantage:** Set formula to '2d20'. You must then use the LOWER value from the returned 'rolls' array.`,

            parameters: parametersSchema,
            action: async ({ formula }) => {
                console.log(`[AI-Dice-Roller] Action started for formula: ${formula}`);

                // The core logic of rolling the dice.
                const result = rollDice(formula);

                if (result) {
                    // Return the full result object as a JSON string.
                    const jsonResult = JSON.stringify(result);
                    console.log(`[AI-Dice-Roller] Returning successful result: ${jsonResult}`);
                    return jsonResult;
                } else {
                    // Inform the AI that the roll failed due to an invalid formula.
                    const errorMessage = `Error: Invalid dice formula "${formula}". Please provide a valid formula like '1d20' or '2d6+3'.`;
                    console.log(`[AI-Dice-Roller] Returning error: ${errorMessage}`);
                    return errorMessage;
                }
            },

            formatMessage: () => '',

            // We are keeping stealth: true for this test.
            stealth: false,
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

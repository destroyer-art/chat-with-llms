import React from "react";
import { Textarea } from "@nextui-org/react";

const InputBar = ({ className, userInput, setUserInput, endContent, onKeyDown }) => {

    return (
        <Textarea
            radius="full"
            key="flat"
            type="textarea"
            size="lg"
            placeholder="Enter your prompt here"
            className={`textarea-placeholder ${className}`} // Use a predefined screen size value
            fullWidth={false}
            minRows={1}
            endContent={endContent}
            value={userInput}
            onChange={(e) => setUserInput(e.target.value)}
            onKeyDown={onKeyDown}
        />
    );
}

export default InputBar;

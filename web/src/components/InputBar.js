import React from "react";
import { Textarea, Button } from "@nextui-org/react";
import { BsSendArrowUp } from "react-icons/bs";

const InputBar = ({ className, userInput, setUserInput, onSend }) => {

    const handleKeyPress = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault(); // Prevent the default action to avoid a new line being added
            onSend(userInput); // Call the onSend prop with the current input value
        }
    };

    const handleClick = () => {
        onSend(userInput); // Call the onSend prop when clicking the send button
    };

    return (
        <Textarea
            radius="full"
            key="flat"
            type="textarea"
            size="lg"
            placeholder="Enter your prompt here"
            className={className} // Use a predefined screen size value
            fullWidth={false}
            minRows={1}
            endContent={
                <Button 
                    isIconOnly 
                    variant="faded" 
                    aria-label="Send"
                    onClick={handleClick}
                >
                    <BsSendArrowUp />
                </Button>
            }
            value={userInput}
            onChange={(e) => setUserInput(e.target.value)}
            onKeyDown={handleKeyPress}
        />
    );
}

export default InputBar;

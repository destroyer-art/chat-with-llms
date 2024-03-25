import React from "react";
import { Textarea } from "@nextui-org/react";
import { BsSendArrowUp } from "react-icons/bs";
import { Button } from "@nextui-org/react";


const InputBar = ({ className }) => {
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
            endContent={<Button isIconOnly variant="faded" aria-label="Send">
                <BsSendArrowUp />
            </Button>}
        />
    );
}

export default InputBar;
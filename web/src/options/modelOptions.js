import { RiOpenaiFill } from "react-icons/ri";
import { FcGoogle } from "react-icons/fc";
import anthropic from "../images/anthropic.svg";
import perplexity from "../images/perplexity.png";
import mistral from "../images/mistral.svg";

export const modelOptions = [
    { label: "GPT-3.5 Turbo", value: "gpt-3.5-turbo", companyLogo: <RiOpenaiFill /> },
    { label: "GPT-4", value: "gpt-4", companyLogo: <RiOpenaiFill /> },
    { label: "GPT-4 Turbo Preview", value: "gpt-4-turbo-preview", companyLogo: <RiOpenaiFill /> },
    { label: "GPT-4 o" , value: "gpt-4o", companyLogo: <RiOpenaiFill /> },
    { label: "Claude 3 Haiku", value: "claude-3-haiku-20240307", companyLogo: <img src={anthropic} alt="" width={20} height={20} /> },
    { label: "Claude 3 Sonnet", value: "claude-3-sonnet-20240229", companyLogo: <img src={anthropic} alt="" width={20} height={20} /> },
    { label: "Claude 3 Opus", value: "claude-3-opus-20240229", companyLogo: <img src={anthropic} alt="" width={20} height={20} /> },
    { label: "Mistral-7b", value: "mistral-tiny-2312", companyLogo: <img src={mistral} alt="" width={20} height={20} /> },
    { label: "Mixtral-8x7b", value: "mistral-small-2312", companyLogo: <img src={mistral} alt="" width={20} height={20} /> },
    { label: "Mistral-small-latest", value: "mistral-small-2402", companyLogo: <img src={mistral} alt="" width={20} height={20} /> },
    { label: "Mistral-medium-latest", value: "mistral-medium-2312", companyLogo: <img src={mistral} alt="" width={20} height={20} /> },
    { label: "Mistral-large-latest", value: "mistral-large-2402", companyLogo: <img src={mistral} alt="" width={20} height={20} /> },
    { label: "Gemini-Pro", value: "gemini-pro", companyLogo: <FcGoogle />},
    { label: "Sonar-Small-Chat", value: "sonar-small-chat", companyLogo: <img src={perplexity} alt="" width={20} height={20} /> },
    { label: "Sonar-Small-Online", value: "sonar-small-online", companyLogo: <img src={perplexity} alt="" width={20} height={20} /> },
    { label: "Sonar-Medium-Chat", value: "sonar-medium-chat", companyLogo: <img src={perplexity} alt="" width={20} height={20} /> },
    { label: "Sonar-Medium-Online", value: "sonar-medium-online", companyLogo: <img src={perplexity} alt="" width={20} height={20} /> },
];

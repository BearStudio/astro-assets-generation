import { splitAndFormatText } from "@/emoji";
import { Emoji } from "./Emoji";

export const TextWithEmoji = ({ children }: { children: string }) => {
  const formatedText = splitAndFormatText(children);
  return (
    <>
      {formatedText.map((part) =>
        part.type === "emoji" ? (
          <Emoji emoji={part.value} />
        ) : (
          <span>{part.value}</span>
        )
      )}
    </>
  );
};

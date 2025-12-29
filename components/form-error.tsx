import { useRouter } from "next/navigation";
import { FaExclamationTriangle } from "react-icons/fa";

interface FormErrorProps {
  message?: string;
}

export const FormError: React.FC<FormErrorProps> = ({ message }) => {
  const router = useRouter();

  if (!message) return null;

  const contactSupportRegex = /(.*?)(contact support)(.*)/i;
  const match = message.match(contactSupportRegex);

  if (match) {
    const [, beforeText, contactText, afterText] = match;

    return (
      <div className="bg-destructive/15 p-3 rounded-md flex items-center gap-x-2 text-sm text-destructive">
        <FaExclamationTriangle className="w-4 h-4" />
        <span>
          {beforeText}
          <button
             onClick={() => router.push('/contact')}
             className="underline hover:no-underline cursor-pointer font-medium text-blue-600 hover:text-blue-800 transition-colors"
             type="button"
             title="Click to go to contact page"
           >
             {contactText}
           </button>
          {afterText}
        </span>
      </div>
    );
  }

  return (
    <div className="bg-destructive/15 p-3 rounded-md flex items-center gap-x-2 text-sm text-destructive">
      <FaExclamationTriangle className="w-4 h-4" />
      <span>{message}</span>
    </div>
  );
};

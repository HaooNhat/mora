import { GoogleIcon } from "@/asset/icons/google.icon";
import { Button } from "@mora/ui/components/button";
import { Loader2 } from "lucide-react";

interface Props {
  isLoading: boolean;
  onClick: () => void;
  label: string;
}

export function AuthGoogleButton({ isLoading, onClick, label }: Props) {
  return (
    <Button
      type="button"
      onClick={onClick}
      disabled={isLoading}
      variant="outline"
      aria-label={label}
      className="w-full h-12 text-sm font-medium border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
    >
      {isLoading ? (
        <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" />
      ) : (
        <>
          <GoogleIcon className="h-5 w-5 mr-2 shrink-0" aria-hidden="true" />
          {label}
        </>
      )}
    </Button>
  );
}

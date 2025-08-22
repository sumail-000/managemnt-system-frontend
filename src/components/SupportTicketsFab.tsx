import { Button } from "@/components/ui/button";
import { HelpCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";

export function SupportTicketsFab() {
  const navigate = useNavigate();
  return (
    <div className="fixed bottom-24 right-6 z-50">
      <Button
        onClick={() => navigate('/support')}
        className="h-14 w-14 rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-110"
        aria-label="Support Center"
      >
        <HelpCircle className="h-6 w-6" />
      </Button>
    </div>
  );
}

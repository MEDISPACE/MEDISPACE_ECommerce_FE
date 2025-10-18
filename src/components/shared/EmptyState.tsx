import { Button } from "../ui/button";
import { Card, CardContent } from "../ui/card";

interface EmptyStateProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  actionLabel?: string;
  actionUrl?: string;
  onAction?: () => void;
}

export function EmptyState({ 
  icon, 
  title, 
  description, 
  actionLabel, 
  actionUrl, 
  onAction 
}: EmptyStateProps) {
  return (
    <Card className="border-blue-100">
      <CardContent className="text-center py-12 px-6">
        <div className="text-blue-300 mb-4 flex justify-center">
          {icon}
        </div>
        <h3 className="text-xl font-medium text-gray-900 mb-2">
          {title}
        </h3>
        <p className="text-gray-600 mb-6 max-w-md mx-auto">
          {description}
        </p>
        
        {(actionLabel && (actionUrl || onAction)) && (
          <div>
            {actionUrl ? (
              <a href={actionUrl}>
                <Button className="bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-700 hover:to-cyan-600">
                  {actionLabel}
                </Button>
              </a>
            ) : (
              <Button 
                onClick={onAction}
                className="bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-700 hover:to-cyan-600"
              >
                {actionLabel}
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
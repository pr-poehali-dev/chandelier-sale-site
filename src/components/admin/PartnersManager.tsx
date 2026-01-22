import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Icon from "@/components/ui/icon";

interface PartnerApplication {
  id: number;
  category: string;
  company_name: string;
  contact_person: string;
  phone: string;
  email: string;
  website?: string;
  description: string;
  created_at: string;
}

interface PartnersManagerProps {
  partnerApplications: PartnerApplication[];
  partnersLoading: boolean;
}

const PartnersManager = ({
  partnerApplications,
  partnersLoading,
}: PartnersManagerProps) => {
  const getCategoryText = (category: string) => {
    switch (category) {
      case "manufacturer":
        return "Производитель";
      case "supplier":
        return "Поставщик";
      case "installer":
        return "Монтажник";
      case "designer":
        return "Дизайнер";
      default:
        return category;
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case "manufacturer":
        return "bg-blue-500";
      case "supplier":
        return "bg-green-500";
      case "installer":
        return "bg-orange-500";
      case "designer":
        return "bg-purple-500";
      default:
        return "bg-gray-500";
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Заявки партнёров ({partnerApplications.length})</CardTitle>
      </CardHeader>
      <CardContent>
        {partnersLoading ? (
          <div className="flex items-center justify-center py-8">
            <Icon name="Loader2" className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : partnerApplications.length === 0 ? (
          <div className="py-8 text-center text-muted-foreground">
            Заявок пока нет
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="p-2 text-left">№</th>
                  <th className="p-2 text-left">Дата</th>
                  <th className="p-2 text-left">Категория</th>
                  <th className="p-2 text-left">Компания</th>
                  <th className="p-2 text-left">Контактное лицо</th>
                  <th className="p-2 text-left">Телефон</th>
                  <th className="p-2 text-left">Email</th>
                  <th className="p-2 text-left">Сайт</th>
                  <th className="p-2 text-left">Описание</th>
                </tr>
              </thead>
              <tbody>
                {partnerApplications.map((app) => (
                  <tr key={app.id} className="border-b hover:bg-muted/50">
                    <td className="p-2">{app.id}</td>
                    <td className="p-2">
                      {new Date(app.created_at).toLocaleDateString("ru-RU")}
                    </td>
                    <td className="p-2">
                      <Badge className={getCategoryColor(app.category)}>
                        {getCategoryText(app.category)}
                      </Badge>
                    </td>
                    <td className="p-2">{app.company_name}</td>
                    <td className="p-2">{app.contact_person}</td>
                    <td className="p-2">
                      <a
                        href={`tel:${app.phone}`}
                        className="text-blue-500 hover:underline"
                      >
                        {app.phone}
                      </a>
                    </td>
                    <td className="p-2">
                      <a
                        href={`mailto:${app.email}`}
                        className="text-blue-500 hover:underline"
                      >
                        {app.email}
                      </a>
                    </td>
                    <td className="p-2">
                      {app.website ? (
                        <a
                          href={app.website}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-500 hover:underline"
                        >
                          <Icon name="ExternalLink" className="inline h-4 w-4" />
                        </a>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td className="p-2 max-w-xs truncate" title={app.description}>
                      {app.description}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default PartnersManager;

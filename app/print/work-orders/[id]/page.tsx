import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default async function PrintWorkOrder({ params }: { params: { id: string } }) {
  const { data: wo, error: e1 } = await supabase
    .from("work_orders")
    .select("*")
    .eq("id", params.id)
    .single();

  if (e1) return <div>Грешка: {e1.message}</div>;

  const { data: parts } = await supabase
    .from("work_order_parts")
    .select("name,qty,unit_price_eur")
    .eq("work_order_id", params.id)
    .order("created_at", { ascending: true });

  const { data: labor } = await supabase
    .from("work_order_labor")
    .select("operation,amount_eur")
    .eq("work_order_id", params.id)
    .order("created_at", { ascending: true });

  const partsTotal = (parts ?? []).reduce((s, p: any) => s + Number(p.qty) * Number(p.unit_price_eur), 0);
  const laborTotal = (labor ?? []).reduce((s, l: any) => s + Number(l.amount_eur), 0);
  const discount = Number(wo.discount_eur ?? 0);
  const grandTotal = partsTotal + laborTotal - discount;

  return (
    <html lang="bg">
      <head>
        <title>Работна карта {wo.number}</title>
        <style>{`
          body { font-family: Arial, sans-serif; margin: 24px; }
          h1,h2,h3 { margin: 0; }
          .row { display:flex; justify-content: space-between; gap: 16px; }
          .box { border: 1px solid #ddd; padding: 10px; border-radius: 8px; margin-top: 10px; }
          table { width: 100%; border-collapse: collapse; margin-top: 8px; }
          th, td { border-bottom: 1px solid #eee; padding: 6px; }
          th { text-align: left; }
          .right { text-align: right; }
          .muted { color: #666; font-size: 12px; }
          @media print {
            .noprint { display: none; }
            body { margin: 0; }
          }
        `}</style>
      </head>
      <body>
        <div className="noprint" style={{ marginBottom: 12 }}>
          <button onClick={() => window.print()}>Печат</button>
        </div>

        <div className="row">
          <div>
            <h2>Работна карта № {wo.number}</h2>
            <div className="muted">
              Приета: {wo.received_at ? new Date(wo.received_at).toLocaleString("bg-BG") : "—"}
              {wo.delivered_at ? ` • Предадена: ${new Date(wo.delivered_at).toLocaleString("bg-BG")}` : ""}
            </div>
          </div>
          <div className="right">
            <b>VSS Garage</b><br />
            <span className="muted">EUR</span>
          </div>
        </div>

        <div className="row">
          <div className="box" style={{ flex: 1 }}>
            <h3>Клиент</h3>
            <div><b>Име:</b> {wo.customer_name}</div>
            <div><b>Тел:</b> {wo.customer_phone ?? "—"}</div>
          </div>
          <div className="box" style={{ flex: 1 }}>
            <h3>Автомобил</h3>
            <div><b>Рег №:</b> {wo.vehicle_reg}</div>
            <div><b>Марка/модел:</b> {(wo.vehicle_make ?? "—") + " " + (wo.vehicle_model ?? "")}</div>
            <div><b>VIN:</b> {wo.vehicle_vin ?? "—"}</div>
            <div><b>Км:</b> {wo.mileage ?? "—"}</div>
          </div>
        </div>

        <div className="box">
          <h3>Оплакване / задача</h3>
          <div>{wo.complaint ?? "—"}</div>
        </div>

        <div className="row">
          <div className="box" style={{ flex: 1 }}>
            <h3>Части</h3>
            <table>
              <thead>
                <tr>
                  <th>Име</th>
                  <th className="right">Кол.</th>
                  <th className="right">Цена</th>
                  <th className="right">Сума</th>
                </tr>
              </thead>
              <tbody>
                {(parts ?? []).map((p: any, i: number) => (
                  <tr key={i}>
                    <td>{p.name}</td>
                    <td className="right">{Number(p.qty).toFixed(2)}</td>
                    <td className="right">{Number(p.unit_price_eur).toFixed(2)}</td>
                    <td className="right">{(Number(p.qty) * Number(p.unit_price_eur)).toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="right"><b>Части общо:</b> {partsTotal.toFixed(2)} EUR</div>
          </div>

          <div className="box" style={{ flex: 1 }}>
            <h3>Труд</h3>
            <table>
              <thead>
                <tr>
                  <th>Операция</th>
                  <th className="right">Сума</th>
                </tr>
              </thead>
              <tbody>
                {(labor ?? []).map((l: any, i: number) => (
                  <tr key={i}>
                    <td>{l.operation}</td>
                    <td className="right">{Number(l.amount_eur).toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="right"><b>Труд общо:</b> {laborTotal.toFixed(2)} EUR</div>
          </div>
        </div>

        <div className="box right">
          <div><b>Общо:</b> {(partsTotal + laborTotal).toFixed(2)} EUR</div>
          <div><b>Отстъпка:</b> {discount.toFixed(2)} EUR</div>
          <div style={{ fontSize: 18 }}><b>Крайна сума:</b> {grandTotal.toFixed(2)} EUR</div>
        </div>

        <div className="row" style={{ marginTop: 18 }}>
          <div style={{ flex: 1 }}>
            Подпис клиент: ______________________
          </div>
          <div style={{ flex: 1 }} className="right">
            Подпис сервиз: ______________________
          </div>
        </div>
      </body>
    </html>
  );
}

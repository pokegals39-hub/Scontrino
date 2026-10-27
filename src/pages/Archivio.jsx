import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Trash2, Store, ChevronDown, ChevronUp } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { Link } from "react-router-dom";

const formatEuro = (n) =>
  new Intl.NumberFormat("it-IT", { style: "currency", currency: "EUR" }).format(
    isNaN(n) ? 0 : n
  );

export default function Archivio() {
  const { toast } = useToast();
  const [scontrini, setScontrini] = useState([]);
  const [loading, setLoading] = useState(true);
  const [espansi, setEspansi] = useState({});

  useEffect(() => {
    carica();
  }, []);

  const carica = async () => {
    setLoading(true);
    try {
      const { items } = await base44.entities.Scontrino.filter(
        {},
        { sort: "-created_date", limit: 100 }
      );
      setScontrini(items);
    } catch (e) {
      toast({ title: "Errore nel caricamento archivio", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const elimina = async (id) => {
    try {
      await base44.entities.Scontrino.delete(id);
      setScontrini(scontrini.filter((s) => s.id !== id));
      toast({ title: "Scontrino eliminato" });
    } catch (e) {
      toast({ title: "Errore nell'eliminazione", variant: "destructive" });
    }
  };

  const toggleEspandi = (id) =>
    setEspansi({ ...espansi, [id]: !espansi[id] });

  return (
    <div className="min-h-screen bg-neutral-100 py-8 px-4">
      <div className="max-w-sm mx-auto">
        <div className="flex items-center justify-between mb-4">
          <Link to="/">
            <Button variant="ghost" size="sm" className="text-neutral-700">
              <ArrowLeft className="w-4 h-4 mr-1" /> Indietro
            </Button>
          </Link>
          <h1 className="font-mono font-bold text-lg flex items-center gap-1">
            <Store className="w-4 h-4" /> Archivio
          </h1>
          <div className="w-16" />
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <div className="w-8 h-8 border-4 border-neutral-200 border-t-neutral-900 rounded-full animate-spin" />
          </div>
        ) : scontrini.length === 0 ? (
          <div className="text-center text-neutral-500 font-mono py-20 text-sm">
            Nessuno scontrino archiviato
          </div>
        ) : (
          <div className="space-y-3">
            {scontrini.map((s) => (
              <div
                key={s.id}
                className="bg-white shadow-md font-mono text-neutral-900"
                style={{ fontFamily: "'Courier New', Courier, monospace" }}
              >
                <div className="border-2 border-dashed border-neutral-900 m-2 p-3">
                  <div
                    className="flex items-center justify-between cursor-pointer"
                    onClick={() => toggleEspandi(s.id)}
                  >
                    <div className="flex-1">
                      <div className="font-bold text-sm">
                        {s.nome_acquisto}
                      </div>
                      <div className="text-[10px] text-neutral-500">
                        {new Date(s.created_date).toLocaleString("it-IT", {
                          dateStyle: "short",
                          timeStyle: "short",
                        })}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm">
                        {formatEuro(s.totale)}
                      </span>
                      {espansi[s.id] ? (
                        <ChevronUp className="w-4 h-4 text-neutral-400" />
                      ) : (
                        <ChevronDown className="w-4 h-4 text-neutral-400" />
                      )}
                    </div>
                  </div>

                  {espansi[s.id] && (
                    <div className="mt-3 pt-3 border-t border-dashed border-neutral-400">
                      {s.prodotti && s.prodotti.length > 0 && (
                        <div className="space-y-1 mb-3">
                          {s.prodotti.map((p, i) => (
                            <div
                              key={i}
                              className="flex justify-between text-xs"
                            >
                              <span>
                                {p.descrizione} x{p.quantita}
                              </span>
                              <span>
                                {formatEuro(p.prezzo * p.quantita)}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                      <div className="border-t border-dashed border-neutral-400 my-2" />
                      <div className="space-y-1 text-xs">
                        <div className="flex justify-between font-bold">
                          <span>TOTALE</span>
                          <span>{formatEuro(s.totale)}</span>
                        </div>
                        <div className="flex justify-between text-neutral-600">
                          <span>Importo dato</span>
                          <span>{formatEuro(s.importo_dato)}</span>
                        </div>
                        <div className="flex justify-between font-bold">
                          <span>RESTO</span>
                          <span>{formatEuro(s.resto)}</span>
                        </div>
                      </div>
                      {s.email_acquirente && (
                        <div className="mt-2 text-[10px] text-neutral-500">
                          Email: {s.email_acquirente}
                        </div>
                      )}
                      <Button
                        onClick={() => elimina(s.id)}
                        variant="outline"
                        size="sm"
                        className="mt-3 w-full border-red-300 text-red-600 hover:bg-red-50"
                      >
                        <Trash2 className="w-3 h-3 mr-1" /> Elimina
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
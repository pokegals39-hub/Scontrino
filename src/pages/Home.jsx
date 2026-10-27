import React, { useState, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Trash2, Archive, Printer, Send, Store, FolderOpen } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { Link } from "react-router-dom";

const formatEuro = (n) =>
  new Intl.NumberFormat("it-IT", { style: "currency", currency: "EUR" }).format(
    isNaN(n) ? 0 : n
  );

export default function Home() {
  const { toast } = useToast();
  const receiptRef = useRef(null);

  const [nomeAcquisto, setNomeAcquisto] = useState("");
  const [prodotti, setProdotti] = useState([
    { descrizione: "", prezzo: "", quantita: 1 },
  ]);
  const [importoDato, setImportoDato] = useState("");
  const [emailAcquirente, setEmailAcquirente] = useState("");
  const [nomeAcquirente, setNomeAcquirente] = useState("");
  const [archiviando, setArchiviando] = useState(false);
  const [inviando, setInviando] = useState(false);

  const totale = prodotti.reduce(
    (acc, p) => acc + (parseFloat(p.prezzo || 0) * (parseFloat(p.quantita) || 0)),
    0
  );
  const resto = (parseFloat(importoDato) || 0) - totale;
  const restoFinale = resto > 0 ? resto : 0;

  const aggiungiProdotto = () =>
    setProdotti([...prodotti, { descrizione: "", prezzo: "", quantita: 1 }]);

  const rimuoviProdotto = (i) =>
    setProdotti(prodotti.filter((_, idx) => idx !== i));

  const aggiornaProdotto = (i, campo, valore) =>
    setProdotti(
      prodotti.map((p, idx) => (idx === i ? { ...p, [campo]: valore } : p))
    );

  const dataOdierna = new Date().toLocaleString("it-IT", {
    dateStyle: "short",
    timeStyle: "short",
  });

  const valida = () => {
    if (!nomeAcquisto.trim()) {
      toast({ title: "Inserisci il nome dell'acquisto", variant: "destructive" });
      return false;
    }
    const validi = prodotti.filter(
      (p) => p.descrizione.trim() && parseFloat(p.prezzo) > 0
    );
    if (validi.length === 0) {
      toast({ title: "Aggiungi almeno un prodotto valido", variant: "destructive" });
      return false;
    }
    return true;
  };

  const archivia = async () => {
    if (!valida()) return;
    setArchiviando(true);
    try {
      await base44.entities.Scontrino.create({
        nome_acquisto: nomeAcquisto,
        prodotti: prodotti
          .filter((p) => p.descrizione.trim())
          .map((p) => ({
            descrizione: p.descrizione,
            prezzo: parseFloat(p.prezzo) || 0,
            quantita: parseFloat(p.quantita) || 1,
          })),
        totale,
        importo_dato: parseFloat(importoDato) || 0,
        resto: restoFinale,
        email_acquirente: emailAcquirente || undefined,
        nome_acquirente: nomeAcquirente || undefined,
      });
      toast({ title: "Scontrino archiviato con successo" });
    } catch (e) {
      toast({ title: "Errore durante l'archiviazione", variant: "destructive" });
    } finally {
      setArchiviando(false);
    }
  };

  const stampa = () => {
    if (!valida()) return;
    window.print();
  };

  const inviaEmail = async () => {
    if (!valida()) return;
    if (!emailAcquirente.trim()) {
      toast({ title: "Inserisci l'email dell'acquirente", variant: "destructive" });
      return;
    }
    setInviando(true);
    try {
      const righe = prodotti
        .filter((p) => p.descrizione.trim())
        .map(
          (p) =>
            `${p.descrizione} x${p.quantita} — ${formatEuro(
              parseFloat(p.prezzo) * parseFloat(p.quantita)
            )}`
        )
        .join("\n");

      const corpo = `Scontrino: ${nomeAcquisto}
Data: ${dataOdierna}

${righe}

--------------------------------
TOTALE:        ${formatEuro(totale)}
IMPORTO DATO:  ${formatEuro(parseFloat(importoDato) || 0)}
RESTO:         ${formatEuro(restoFinale)}

Grazie e arrivederci!`;

      await base44.integrations.Core.SendEmail({
        to: emailAcquirente,
        subject: `Scontrino - ${nomeAcquisto}`,
        body: corpo,
      });
      toast({ title: "Email inviata all'acquirente" });
    } catch (e) {
      toast({
        title: "Errore durante l'invio email",
        description:
          e?.message ||
          "L'app deve essere pubblicata con un dominio personalizzato per inviare email a indirizzi non registrati.",
        variant: "destructive",
      });
    } finally {
      setInviando(false);
    }
  };

  return (
    <div className="min-h-screen bg-neutral-100 py-8 px-4 print:bg-white print:p-0 flex justify-center">
      <div className="w-full max-w-sm">
        {/* Scontrino */}
        <div
          ref={receiptRef}
          className="receipt-print bg-white shadow-xl print:shadow-none font-mono text-neutral-900 relative overflow-hidden"
          style={{ fontFamily: "'Courier New', Courier, monospace" }}
        >
          {/* bordo tratteggiato */}
          <div className="border-2 border-dashed border-neutral-900 m-2 p-4">
            {/* Intestazione */}
            <div className="text-center mb-3">
              <div className="flex items-center justify-center gap-1 mb-1">
                <Store className="w-4 h-4" />
                <span className="font-bold text-sm tracking-wider">Scontrino</span>
              </div>
              <div className="text-[10px] text-neutral-500">{dataOdierna}</div>
            </div>

            <div className="border-t border-dashed border-neutral-400 my-2" />

            {/* Nome acquisto */}
            <div className="mb-3">
              <Label className="text-[10px] uppercase tracking-wider text-neutral-500">
                Nome acquisto
              </Label>
              <Input
                value={nomeAcquisto}
                onChange={(e) => setNomeAcquisto(e.target.value)}
                placeholder="Es. Spesa settimanale"
                className="font-mono font-bold text-sm border-0 border-b border-neutral-300 rounded-none px-0 focus-visible:ring-0 focus-visible:border-neutral-900"
              />
            </div>

            <div className="border-t border-dashed border-neutral-400 my-2" />

            {/* Prodotti */}
            <div className="space-y-2 mb-3">
              {prodotti.map((p, i) => (
                <div key={i} className="group">
                  <div className="flex items-start gap-1">
                    <div className="flex-1">
                      <Input
                        value={p.descrizione}
                        onChange={(e) =>
                          aggiornaProdotto(i, "descrizione", e.target.value)
                        }
                        placeholder="Descrizione"
                        className="font-mono text-xs h-7 px-1 border-0 border-b border-neutral-200 rounded-none focus-visible:ring-0 focus-visible:border-neutral-900"
                      />
                    </div>
                    <button
                      onClick={() => rimuoviProdotto(i)}
                      className="text-neutral-300 hover:text-red-500 mt-1 print:hidden"
                      type="button"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                  <div className="flex items-center gap-1 mt-1">
                    <span className="text-[10px] text-neutral-500 w-6">€</span>
                    <Input
                      type="number"
                      step="0.01"
                      value={p.prezzo}
                      onChange={(e) =>
                        aggiornaProdotto(i, "prezzo", e.target.value)
                      }
                      placeholder="0.00"
                      className="font-mono text-xs h-7 px-1 w-24 border-0 border-b border-neutral-200 rounded-none focus-visible:ring-0 focus-visible:border-neutral-900"
                    />
                    <span className="text-[10px] text-neutral-500">x</span>
                    <Input
                      type="number"
                      step="1"
                      value={p.quantita}
                      onChange={(e) =>
                        aggiornaProdotto(i, "quantita", e.target.value)
                      }
                      className="font-mono text-xs h-7 px-1 w-12 border-0 border-b border-neutral-200 rounded-none focus-visible:ring-0 focus-visible:border-neutral-900"
                    />
                    <span className="ml-auto text-xs font-bold">
                      {formatEuro(
                        (parseFloat(p.prezzo) || 0) * (parseFloat(p.quantita) || 0)
                      )}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            <button
              onClick={aggiungiProdotto}
              className="w-full flex items-center justify-center gap-1 text-[10px] uppercase tracking-wider text-neutral-600 border border-dashed border-neutral-300 py-1 hover:border-neutral-900 hover:text-neutral-900 print:hidden"
              type="button"
            >
              <Plus className="w-3 h-3" /> Aggiungi prodotto
            </button>

            <div className="border-t border-dashed border-neutral-400 my-3" />

            {/* Totali */}
            <div className="space-y-1 text-xs">
              <div className="flex justify-between font-bold text-sm">
                <span>TOTALE</span>
                <span>{formatEuro(totale)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-600">Importo dato</span>
                <Input
                  type="number"
                  step="0.01"
                  value={importoDato}
                  onChange={(e) => setImportoDato(e.target.value)}
                  placeholder="0.00"
                  className="font-mono text-xs h-6 w-24 px-1 text-right border-0 border-b border-neutral-200 rounded-none focus-visible:ring-0 focus-visible:border-neutral-900"
                />
              </div>
              <div className="flex justify-between font-bold text-sm pt-1 border-t border-dashed border-neutral-400">
                <span>RESTO</span>
                <span>{formatEuro(restoFinale)}</span>
              </div>
            </div>

            <div className="border-t border-dashed border-neutral-400 my-3" />

            {/* Email acquirente */}
            <div className="mb-2 print:hidden">
              <Label className="text-[10px] uppercase tracking-wider text-neutral-500">
                Email acquirente (opzionale)
              </Label>
              <Input
                type="email"
                value={emailAcquirente}
                onChange={(e) => setEmailAcquirente(e.target.value)}
                placeholder="email@esempio.com"
                className="font-mono text-xs h-7 px-1 border-0 border-b border-neutral-200 rounded-none focus-visible:ring-0 focus-visible:border-neutral-900"
              />
            </div>

            {/* Nome acquirente */}
            <div className="mb-2 print:hidden">
              <Label className="text-[10px] uppercase tracking-wider text-neutral-500">
                Nome acquirente (opzionale)
              </Label>
              <Input
                value={nomeAcquirente}
                onChange={(e) => setNomeAcquirente(e.target.value)}
                placeholder="Es. Mario Rossi"
                className="font-mono text-xs h-7 px-1 border-0 border-b border-neutral-200 rounded-none focus-visible:ring-0 focus-visible:border-neutral-900"
              />
            </div>

            <div className="border-t border-dashed border-neutral-400 my-3" />

            <div className="text-center text-[10px] text-neutral-500">
              *** Grazie e arrivederci ***
            </div>

            {/* Nome acquirente in fondo a destra */}
            {nomeAcquirente.trim() && (
              <div className="text-right text-[10px] text-neutral-700 font-bold mt-1">
                {nomeAcquirente}
              </div>
            )}
          </div>
        </div>

        {/* Pulsanti */}
        <div className="mt-4 grid grid-cols-1 gap-2 print:hidden">
          <Link to="/archivio">
            <Button variant="ghost" className="w-full text-neutral-600 hover:text-neutral-900">
              <FolderOpen className="w-4 h-4 mr-2" /> Vai all'archivio
            </Button>
          </Link>
          <Button
            onClick={archivia}
            disabled={archiviando}
            className="w-full bg-neutral-900 hover:bg-neutral-800"
          >
            <Archive className="w-4 h-4 mr-2" />
            {archiviando ? "Archiviazione..." : "Invia in archivio"}
          </Button>
          <div className="grid grid-cols-2 gap-2">
            <Button
              onClick={stampa}
              variant="outline"
              className="border-neutral-900 text-neutral-900 hover:bg-neutral-100"
            >
              <Printer className="w-4 h-4 mr-2" /> Stampa
            </Button>
            <Button
              onClick={inviaEmail}
              disabled={inviando}
              variant="outline"
              className="border-neutral-900 text-neutral-900 hover:bg-neutral-100"
            >
              <Send className="w-4 h-4 mr-2" />
              {inviando ? "Invio..." : "Invia email"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
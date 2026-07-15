// components/LeadImportDropzone.tsx
"use client";

import { log } from "console";
import { Upload } from "lucide-react";
import { useState } from "react";
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
  type ColumnDef,
} from "@tanstack/react-table";
import LeadsPage from "./table";
import * as XLSX from "xlsx";
import { Button } from "@/components/ui/button";


export default   function LeadImportDropzone() {
  
  const [file,setfile]=useState<File|null>(null);
  const [dragging,setdragging]=useState(false);
  const ACCEPTED=[".csv",".xlsx"];
  const [message,setmessage]=useState('')
  const [data, setData] = useState<Record<string, string>[]>([]);
  const [workbook, setWorkbook] = useState<XLSX.WorkBook | null>(null);
  const [sheetIndex, setSheetIndex] = useState(0);
  const [sheetRowCounts, setSheetRowCounts] = useState<number[]>([]);
  const sheetName = workbook?.SheetNames[sheetIndex] ?? "";
  const hasPrevSheet = sheetRowCounts.slice(0, sheetIndex).some((c) => c > 0);
  const hasNextSheet = sheetRowCounts.slice(sheetIndex + 1).some((c) => c > 0);
  const accept=(f:File | undefined)=>{
    if(!f){
      setfile(null)
      return
    }
    let ext=f.name.slice(f.name.lastIndexOf('.')).toLowerCase();

    if(!ACCEPTED.includes(ext)){

      setfile(null)
      setmessage("Format non pris en charge. Utilisez un fichier CSV ou XLSX.");
    }
    else{
      setfile(f)
      setWorkbook(null)
      setSheetIndex(0)
      if (ext==='.csv'){
            readCsv(f)
      }
      else{
        readXlsx(f)
      }
    }
    return
}


const sheetRows = (wb: XLSX.WorkBook, index: number) =>
  XLSX.utils.sheet_to_json<Record<string, string>>(wb.Sheets[wb.SheetNames[index]], { defval: "" });

const loadSheetRows = (wb: XLSX.WorkBook, index: number) => {
  const name = wb.SheetNames[index];
  const rows = sheetRows(wb, index);
  console.log(`[import] onglet "${name}" (${index + 1}/${wb.SheetNames.length}) -> ${rows.length} ligne(s)`, rows);
  setSheetIndex(index);
  setData(rows);
};

// Passe à la prochaine feuille non vide dans la direction donnée (1 = suivante, -1 = précédente).
// Les feuilles vides ne sont jamais présentées pour le mapping.
const goToAdjacentSheet = (wb: XLSX.WorkBook, counts: number[], from: number, direction: 1 | -1) => {
  let idx = from + direction;
  while (idx >= 0 && idx < wb.SheetNames.length) {
    if (counts[idx] > 0) {
      loadSheetRows(wb, idx);
      return;
    }
    idx += direction;
  }
};

const readXlsx = async (f: File) => {
  const buffer = await f.arrayBuffer();
  const wb = XLSX.read(buffer);
  const counts = wb.SheetNames.map((_, idx) => sheetRows(wb, idx).length);
  console.log(
    "[import] onglets détectés :",
    wb.SheetNames.map((name, idx) => `${name} (${counts[idx]} ligne(s))`)
  );
  setWorkbook(wb);
  setSheetRowCounts(counts);

  // Un classeur peut contenir plusieurs onglets. On les traite dans l'ordre,
  // en ignorant les feuilles vides : mapping + import de la 1ère feuille non
  // vide, puis passage à la suivante non vide, etc.
  const firstNonEmpty = counts.findIndex((c) => c > 0);
  loadSheetRows(wb, firstNonEmpty === -1 ? 0 : firstNonEmpty);
};

const detectDelimiter = (headerLine: string): string => {
  const candidates = [",", ";", "\t", "|"];

  return candidates.reduce((best, current) =>
    headerLine.split(current).length > headerLine.split(best).length
      ? current
      : best
  );
};

const readCsv = async (f: File) => {
  const text = await f.text();
  const lines = text.trim().split("\n");

  const delimiter = detectDelimiter(lines[0]);

  const headers = lines[0].split(delimiter).map((h) => h.trim());

  const rows = lines.slice(1).map((line) => {
    const values = line.split(delimiter);
    const obj: Record<string, string> = {};
    headers.forEach((h, i) => {
      obj[h] = values[i]?.trim() ?? "";
    });
    return obj;
  });

  setData(rows);
};
  return (
    <>
    {!file && <div className="flex items-center justify-center min-h-screen p-6" style={{ background: "linear-gradient(160deg, #0f172a 0%, #1e1b4b 100%)" }}>
               <div className=" w-full max-w-md rounded-3xl border border-white/10 bg-gradient-to-br from-slate-900 to-indigo-950 p-8">
                    <h2 className="text-2xl font-semibold text-white ">Importer vos leads</h2>
                    <p className="pt-2 text-gray-400">Chaque ligne de votre fichier devient un contact dans votre pipeline.</p>
                    <label onDragOver={(e)=>{
                      e.preventDefault();
                      setdragging(true);
                    }}  onDragLeave={()=>{
                      setdragging(true)
                    }} onDrop={(e)=>{
                      e.preventDefault();
                      setdragging(false);
                      accept(e.dataTransfer.files?.[0])
                    }} className="mt-6 cursor-pointer flex flex-col items-center   rounded-2xl border-2 border-dashed border-white/15 border-white/[0.3] p-8 text-center ">
                            <input onChange={(e)=>{
                              const ext=accept(e.target.files?.[0])
                              

                            }} accept=".csv,.xlsx" type="file" name="" id="" className="sr-only"/>
                            <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-teal-400/20 bg-teal-400/10">
  <Upload size={28} strokeWidth={1.75}  className="text-teal-300" />
</div>

                              <p className="text-lg font-semibold text-slate-200">Glissez votre fichier ici</p>
                              <p className=" text-green-500 "><span className="text-gray-400">ou</span> <span className="underline">parcourez vos fichier</span></p>
                    </label>
               </div>
          </div>}

          {file && workbook && workbook.SheetNames.length > 1 && (
            <div className="flex items-center gap-2 px-3 pt-2 sm:px-6">
              <Button
                variant="outline"
                size="sm"
                onClick={() => goToAdjacentSheet(workbook, sheetRowCounts, sheetIndex, -1)}
                disabled={!hasPrevSheet}
                className="border-white/10 bg-transparent text-slate-300 hover:bg-white/5 hover:text-white"
              >
                ← Précédente
              </Button>
              <select
                value={sheetName}
                onChange={(e) => {
                  const idx = workbook.SheetNames.indexOf(e.target.value)
                  if (sheetRowCounts[idx] > 0) loadSheetRows(workbook, idx)
                }}
                className="rounded-md border border-white/10 bg-white/5 px-2 py-1 text-sm text-slate-200 outline-none focus:border-teal-400/50"
              >
                {workbook.SheetNames.map((name, idx) => (
                  <option
                    key={name}
                    value={name}
                    disabled={sheetRowCounts[idx] === 0}
                    className="bg-slate-900 text-slate-200"
                  >
                    {idx + 1}/{workbook.SheetNames.length} — {name}
                    {sheetRowCounts[idx] === 0 ? " (vide)" : ""}
                  </option>
                ))}
              </select>
              <Button
                variant="outline"
                size="sm"
                onClick={() => goToAdjacentSheet(workbook, sheetRowCounts, sheetIndex, 1)}
                disabled={!hasNextSheet}
                className="border-white/10 bg-transparent text-slate-300 hover:bg-white/5 hover:text-white"
              >
                Suivante →
              </Button>
            </div>
          )}

          {file && (
            <LeadsPage
              key={sheetName}
              data={data}
              filename={
                workbook && workbook.SheetNames.length > 1
                  ? `${file.name} [${sheetName}]`
                  : file.name
              }
              sheetLabel={
                workbook && workbook.SheetNames.length > 1
                  ? `Feuille ${sheetIndex + 1}/${workbook.SheetNames.length} — ${sheetName}`
                  : undefined
              }
              hasNextSheet={hasNextSheet}
              onNextSheet={() => workbook && goToAdjacentSheet(workbook, sheetRowCounts, sheetIndex, 1)}
            />
          )}
    
    </>
          
  );
}


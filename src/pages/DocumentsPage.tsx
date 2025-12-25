import { useState } from 'react';
import { FileText, Plus, Trash2, Download, Calendar, AlertTriangle, CheckCircle2, Clock } from 'lucide-react';
import { Layout } from '@/components/Layout';
import { PageHeader } from '@/components/PageHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { format, parseISO, differenceInDays } from 'date-fns';
import { it } from 'date-fns/locale';
import { toast } from 'sonner';

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

interface Document {
  id: string;
  type: DocumentType;
  name: string;
  issueDate: string;
  expiryDate: string;
  cost?: number;
  notes?: string;
}

type DocumentType = 'insurance' | 'road_tax' | 'mot' | 'license' | 'registration' | 'other';

const DOCUMENT_TYPES: Record<DocumentType, string> = {
  insurance: 'Assicurazione',
  road_tax: 'Bollo',
  mot: 'Revisione',
  license: 'Patente',
  registration: 'Libretto',
  other: 'Altro',
};

export default function DocumentsPage() {
  const { value: documents, setValue: setDocuments, deleteItem } = useLocalStorage<Document[]>('moto-documents', []);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingDoc, setEditingDoc] = useState<Document | null>(null);

  const [formData, setFormData] = useState({
    type: 'insurance' as DocumentType,
    name: '',
    issueDate: format(new Date(), 'yyyy-MM-dd'),
    expiryDate: '',
    cost: '',
    notes: '',
  });

  const getDocumentStatus = (doc: Document) => {
    const daysUntilExpiry = differenceInDays(parseISO(doc.expiryDate), new Date());
    
    if (daysUntilExpiry < 0) {
      return { status: 'expired', label: 'Scaduto', daysRemaining: daysUntilExpiry };
    } else if (daysUntilExpiry <= 30) {
      return { status: 'expiring', label: 'In Scadenza', daysRemaining: daysUntilExpiry };
    } else {
      return { status: 'valid', label: 'Valido', daysRemaining: daysUntilExpiry };
    }
  };

  const expiredDocs = documents.filter(d => getDocumentStatus(d).status === 'expired');
  const expiringDocs = documents.filter(d => getDocumentStatus(d).status === 'expiring');
  const validDocs = documents.filter(d => getDocumentStatus(d).status === 'valid');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name || !formData.expiryDate) {
      toast.error('Compila tutti i campi obbligatori');
      return;
    }

    const newDoc: Document = {
      id: editingDoc?.id || generateId(),
      type: formData.type,
      name: formData.name,
      issueDate: formData.issueDate,
      expiryDate: formData.expiryDate,
      cost: formData.cost ? parseFloat(formData.cost) : undefined,
      notes: formData.notes || undefined,
    };

    if (editingDoc) {
      setDocuments(documents.map(d => d.id === editingDoc.id ? newDoc : d));
      toast.success('Documento aggiornato');
    } else {
      setDocuments([...documents, newDoc]);
      toast.success('Documento aggiunto');
    }

    resetForm();
  };

  const resetForm = () => {
    setFormData({
      type: 'insurance',
      name: '',
      issueDate: format(new Date(), 'yyyy-MM-dd'),
      expiryDate: '',
      cost: '',
      notes: '',
    });
    setEditingDoc(null);
    setIsDialogOpen(false);
  };

  const handleEdit = (doc: Document) => {
    setFormData({
      type: doc.type,
      name: doc.name,
      issueDate: doc.issueDate,
      expiryDate: doc.expiryDate,
      cost: doc.cost?.toString() || '',
      notes: doc.notes || '',
    });
    setEditingDoc(doc);
    setIsDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    deleteItem(id);
    toast.success('Documento eliminato');
  };

  const handleTypeChange = (type: DocumentType) => {
    const defaultName = DOCUMENT_TYPES[type];
    setFormData({
      ...formData,
      type,
      name: defaultName,
    });
  };

  return (
    <Layout>
      <PageHeader
        title="Documenti"
        description="Gestisci assicurazione, bollo, revisione e altri documenti"
        icon={FileText}
        action={{
          label: 'Aggiungi Documento',
          onClick: () => setIsDialogOpen(true),
          icon: Plus,
        }}
      />

      {/* Status Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <Card className={`glass-card border-destructive/50 ${expiredDocs.length > 0 ? 'animate-pulse' : ''}`}>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-destructive/20 flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-destructive" />
              </div>
              <div>
                <p className="text-2xl font-display font-bold text-destructive">{expiredDocs.length}</p>
                <p className="text-sm text-muted-foreground">Scaduti</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card border-warning/50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-warning/20 flex items-center justify-center">
                <Clock className="w-6 h-6 text-warning" />
              </div>
              <div>
                <p className="text-2xl font-display font-bold text-warning">{expiringDocs.length}</p>
                <p className="text-sm text-muted-foreground">In Scadenza</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card border-success/50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-success/20 flex items-center justify-center">
                <CheckCircle2 className="w-6 h-6 text-success" />
              </div>
              <div>
                <p className="text-2xl font-display font-bold text-success">{validDocs.length}</p>
                <p className="text-sm text-muted-foreground">Validi</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Expired Alert */}
      {expiredDocs.length > 0 && (
        <div className="mb-6 p-4 rounded-xl bg-destructive/10 border border-destructive/30">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-bold text-destructive">Documenti Scaduti!</h3>
              <p className="text-sm text-muted-foreground">
                I seguenti documenti sono scaduti:{' '}
                <span className="font-medium text-foreground">
                  {expiredDocs.map(d => d.name).join(', ')}
                </span>
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Documents List */}
      {documents.length === 0 ? (
        <Card className="glass-card">
          <CardContent className="py-12 text-center">
            <FileText className="w-16 h-16 mx-auto text-muted-foreground/50 mb-4" />
            <h3 className="font-display text-xl font-bold mb-2">Nessun documento</h3>
            <p className="text-muted-foreground mb-6">
              Aggiungi assicurazione, bollo e altri documenti per monitorare le scadenze
            </p>
            <Button onClick={() => setIsDialogOpen(true)} className="btn-glow">
              <Plus className="w-4 h-4 mr-2" />
              Aggiungi Documento
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {documents.map((doc) => {
            const status = getDocumentStatus(doc);
            const statusColors = {
              valid: 'border-success/30',
              expiring: 'border-warning/30',
              expired: 'border-destructive/30 bg-destructive/5',
            };
            
            return (
              <Card key={doc.id} className={`glass-card transition-all ${statusColors[status.status as keyof typeof statusColors]}`}>
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                        status.status === 'valid' ? 'bg-success/20' :
                        status.status === 'expiring' ? 'bg-warning/20' : 'bg-destructive/20'
                      }`}>
                        <FileText className={`w-5 h-5 ${
                          status.status === 'valid' ? 'text-success' :
                          status.status === 'expiring' ? 'text-warning' : 'text-destructive'
                        }`} />
                      </div>
                      <div>
                        <CardTitle className="text-base">{doc.name}</CardTitle>
                        <Badge variant="outline" className="text-xs mt-1">
                          {DOCUMENT_TYPES[doc.type]}
                        </Badge>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive"
                      onClick={() => handleDelete(doc.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div className="p-2 rounded-lg bg-secondary/50">
                      <p className="text-xs text-muted-foreground">Emissione</p>
                      <p className="font-medium">
                        {format(parseISO(doc.issueDate), 'd MMM yyyy', { locale: it })}
                      </p>
                    </div>
                    <div className={`p-2 rounded-lg ${
                      status.status === 'valid' ? 'bg-success/10' :
                      status.status === 'expiring' ? 'bg-warning/10' : 'bg-destructive/10'
                    }`}>
                      <p className="text-xs text-muted-foreground">Scadenza</p>
                      <p className="font-medium">
                        {format(parseISO(doc.expiryDate), 'd MMM yyyy', { locale: it })}
                      </p>
                    </div>
                  </div>

                  <div className={`p-3 rounded-lg text-center ${
                    status.status === 'valid' ? 'bg-success/10 text-success' :
                    status.status === 'expiring' ? 'bg-warning/10 text-warning' : 'bg-destructive/10 text-destructive'
                  }`}>
                    {status.status === 'expired' ? (
                      <span className="font-bold">Scaduto da {Math.abs(status.daysRemaining)} giorni</span>
                    ) : (
                      <span className="font-bold">Scade tra {status.daysRemaining} giorni</span>
                    )}
                  </div>

                  {doc.cost && (
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-muted-foreground">Costo</span>
                      <span className="font-bold text-primary">€{doc.cost.toFixed(2)}</span>
                    </div>
                  )}

                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full"
                    onClick={() => handleEdit(doc)}
                  >
                    <Calendar className="w-4 h-4 mr-2" />
                    Modifica
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Add/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="glass-card border-border sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-display text-2xl">
              {editingDoc ? 'Modifica Documento' : 'Aggiungi Documento'}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="type">Tipo Documento</Label>
              <Select
                value={formData.type}
                onValueChange={(v) => handleTypeChange(v as DocumentType)}
              >
                <SelectTrigger className="input-glow">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(DOCUMENT_TYPES).map(([key, label]) => (
                    <SelectItem key={key} value={key}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="name">Nome</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Es. Assicurazione Generali"
                className="input-glow"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="issueDate">Data Emissione</Label>
                <Input
                  id="issueDate"
                  type="date"
                  value={formData.issueDate}
                  onChange={(e) => setFormData({ ...formData, issueDate: e.target.value })}
                  className="input-glow"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="expiryDate">Data Scadenza</Label>
                <Input
                  id="expiryDate"
                  type="date"
                  value={formData.expiryDate}
                  onChange={(e) => setFormData({ ...formData, expiryDate: e.target.value })}
                  className="input-glow"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="cost">Costo (€)</Label>
              <Input
                id="cost"
                type="number"
                step="0.01"
                value={formData.cost}
                onChange={(e) => setFormData({ ...formData, cost: e.target.value })}
                placeholder="Opzionale"
                className="input-glow"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Note</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Note aggiuntive..."
                className="input-glow resize-none"
                rows={2}
              />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={resetForm}>
                Annulla
              </Button>
              <Button type="submit" className="btn-glow">
                {editingDoc ? 'Aggiorna' : 'Aggiungi'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </Layout>
  );
}
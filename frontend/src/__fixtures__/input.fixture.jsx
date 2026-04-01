import { Input } from '../components/ui/input';

export default {
  default: (
    <div className="p-8 space-y-4 max-w-md">
      <h2 className="text-xl font-bold">Champs de texte</h2>
      <Input placeholder="Texte normal" />
      <Input placeholder="Avec valeur" value="Contenu prérempli" />
      <Input placeholder="Désactivé" disabled />
      <Input placeholder="Erreur" className="border-red-500" />
      <h2 className="text-xl font-bold mt-4">Types</h2>
      <Input type="email" placeholder="Email" />
      <Input type="password" placeholder="Mot de passe" />
      <Input type="date" />
    </div>
  )
};
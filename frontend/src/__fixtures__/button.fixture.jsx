import { Button } from '../components/ui/button';

export default {
  default: (
    <div className="p-8 space-y-4">
      <h2 className="text-xl font-bold">Variantes de boutons</h2>
      <div className="flex gap-2">
        <Button variant="default">Default</Button>
        <Button variant="destructive">Destructive</Button>
        <Button variant="outline">Outline</Button>
        <Button variant="secondary">Secondary</Button>
        <Button variant="ghost">Ghost</Button>
        <Button variant="link">Link</Button>
      </div>
      <h2 className="text-xl font-bold mt-4">Tailles</h2>
      <div className="flex gap-2 items-center">
        <Button size="sm">Small</Button>
        <Button size="default">Default</Button>
        <Button size="lg">Large</Button>
      </div>
      <h2 className="text-xl font-bold mt-4">Avec état disabled</h2>
      <Button disabled>Disabled</Button>
    </div>
  )
};
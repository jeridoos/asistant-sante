import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/card';

export default {
  default: (
    <div className="p-8 grid grid-cols-2 gap-4">
      <Card>
        <CardHeader>
          <CardTitle>Streak</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">5</div>
          <p className="text-xs text-gray-500">jours consécutifs</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Taux d'observance</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">87%</div>
          <p className="text-xs text-gray-500">sur 7 jours</p>
        </CardContent>
      </Card>
    </div>
  )
};
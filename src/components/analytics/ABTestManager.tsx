import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Progress } from '@/components/ui/progress';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger
} from '@/components/ui/dialog';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    Plus,
    Play,
    Pause,
    BarChart3,
    TrendingUp,
    Users,
    Target,
    AlertCircle
} from 'lucide-react';
import { ABTestExperiment, ABTestVariant } from '@/types/analytics';

interface ABTestManagerProps {
    experiments?: ABTestExperiment[];
    onCreateExperiment?: (experiment: Omit<ABTestExperiment, 'id'>) => void;
    onUpdateExperiment?: (id: string, updates: Partial<ABTestExperiment>) => void;
}

export const ABTestManager: React.FC<ABTestManagerProps> = ({
    experiments = [],
    onCreateExperiment,
    onUpdateExperiment
}) => {
    const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
    const [newExperiment, setNewExperiment] = useState<Partial<ABTestExperiment>>({
        name: '',
        description: '',
        status: 'draft',
        variants: [
            { id: 'control', name: 'Control', description: 'Original version', isControl: true, trafficPercentage: 50 },
            { id: 'variant-a', name: 'Variant A', description: 'Test version', isControl: false, trafficPercentage: 50 }
        ]
    });

    const handleCreateExperiment = () => {
        if (newExperiment.name && newExperiment.description && onCreateExperiment) {
            onCreateExperiment({
                ...newExperiment,
                startDate: new Date().toISOString(),
                variants: newExperiment.variants || [],
                metrics: [
                    { name: 'Conversion Rate', type: 'conversion', description: 'Percentage of visitors who convert', isPrimary: true },
                    { name: 'Revenue per User', type: 'revenue', description: 'Average revenue generated per user', isPrimary: false }
                ]
            } as Omit<ABTestExperiment, 'id'>);

            setIsCreateDialogOpen(false);
            setNewExperiment({
                name: '',
                description: '',
                status: 'draft',
                variants: [
                    { id: 'control', name: 'Control', description: 'Original version', isControl: true, trafficPercentage: 50 },
                    { id: 'variant-a', name: 'Variant A', description: 'Test version', isControl: false, trafficPercentage: 50 }
                ]
            });
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'running': return 'bg-green-100 text-green-800';
            case 'completed': return 'bg-blue-100 text-blue-800';
            case 'paused': return 'bg-yellow-100 text-yellow-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'running': return <Play className="h-3 w-3" />;
            case 'paused': return <Pause className="h-3 w-3" />;
            case 'completed': return <BarChart3 className="h-3 w-3" />;
            default: return <AlertCircle className="h-3 w-3" />;
        }
    };

    const addVariant = () => {
        const newVariantId = `variant-${String.fromCharCode(65 + (newExperiment.variants?.length || 1))}`;
        const currentVariants = newExperiment.variants || [];
        const newTrafficPercentage = Math.floor(100 / (currentVariants.length + 1));

        // Redistribute traffic equally
        const updatedVariants = currentVariants.map(variant => ({
            ...variant,
            trafficPercentage: newTrafficPercentage
        }));

        setNewExperiment({
            ...newExperiment,
            variants: [
                ...updatedVariants,
                {
                    id: newVariantId.toLowerCase(),
                    name: newVariantId,
                    description: `Test variant ${newVariantId}`,
                    isControl: false,
                    trafficPercentage: newTrafficPercentage
                }
            ]
        });
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-bold">A/B Test Manager</h2>
                    <p className="text-muted-foreground">Create and manage A/B tests to optimize your store</p>
                </div>

                <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                    <DialogTrigger asChild>
                        <Button>
                            <Plus className="h-4 w-4 mr-2" />
                            New Experiment
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl">
                        <DialogHeader>
                            <DialogTitle>Create New A/B Test</DialogTitle>
                        </DialogHeader>

                        <div className="space-y-6">
                            {/* Basic Info */}
                            <div className="space-y-4">
                                <div>
                                    <Label htmlFor="experiment-name">Experiment Name</Label>
                                    <Input
                                        id="experiment-name"
                                        value={newExperiment.name || ''}
                                        onChange={(e) => setNewExperiment({ ...newExperiment, name: e.target.value })}
                                        placeholder="e.g., Homepage Hero Button Color Test"
                                    />
                                </div>

                                <div>
                                    <Label htmlFor="experiment-description">Description</Label>
                                    <Textarea
                                        id="experiment-description"
                                        value={newExperiment.description || ''}
                                        onChange={(e) => setNewExperiment({ ...newExperiment, description: e.target.value })}
                                        placeholder="Describe what you're testing and why..."
                                    />
                                </div>
                            </div>

                            {/* Variants */}
                            <div className="space-y-4">
                                <div className="flex justify-between items-center">
                                    <Label>Test Variants</Label>
                                    <Button variant="outline" size="sm" onClick={addVariant}>
                                        <Plus className="h-3 w-3 mr-1" />
                                        Add Variant
                                    </Button>
                                </div>

                                <div className="space-y-3">
                                    {newExperiment.variants?.map((variant, index) => (
                                        <div key={variant.id} className="border rounded-lg p-4">
                                            <div className="flex items-center justify-between mb-2">
                                                <div className="flex items-center gap-2">
                                                    <Badge variant={variant.isControl ? 'default' : 'secondary'}>
                                                        {variant.isControl ? 'Control' : 'Variant'}
                                                    </Badge>
                                                    <span className="font-medium">{variant.name}</span>
                                                </div>
                                                <span className="text-sm text-muted-foreground">
                                                    {variant.trafficPercentage}% traffic
                                                </span>
                                            </div>
                                            <Input
                                                value={variant.description}
                                                onChange={(e) => {
                                                    const updatedVariants = [...(newExperiment.variants || [])];
                                                    updatedVariants[index] = { ...variant, description: e.target.value };
                                                    setNewExperiment({ ...newExperiment, variants: updatedVariants });
                                                }}
                                                placeholder="Describe this variant..."
                                                className="text-sm"
                                            />
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="flex justify-end gap-2">
                                <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                                    Cancel
                                </Button>
                                <Button onClick={handleCreateExperiment}>
                                    Create Experiment
                                </Button>
                            </div>
                        </div>
                    </DialogContent>
                </Dialog>
            </div>

            {/* Experiments List */}
            <div className="grid gap-6">
                {experiments.length === 0 ? (
                    <Card>
                        <CardContent className="flex flex-col items-center justify-center py-12">
                            <BarChart3 className="h-12 w-12 text-muted-foreground mb-4" />
                            <h3 className="text-lg font-medium mb-2">No experiments yet</h3>
                            <p className="text-muted-foreground text-center mb-4">
                                Create your first A/B test to start optimizing your store's performance
                            </p>
                            <Button onClick={() => setIsCreateDialogOpen(true)}>
                                <Plus className="h-4 w-4 mr-2" />
                                Create First Experiment
                            </Button>
                        </CardContent>
                    </Card>
                ) : (
                    experiments.map((experiment) => (
                        <Card key={experiment.id}>
                            <CardHeader>
                                <div className="flex justify-between items-start">
                                    <div>
                                        <CardTitle className="flex items-center gap-2">
                                            {experiment.name}
                                            <Badge className={getStatusColor(experiment.status)}>
                                                {getStatusIcon(experiment.status)}
                                                <span className="ml-1 capitalize">{experiment.status}</span>
                                            </Badge>
                                        </CardTitle>
                                        <p className="text-sm text-muted-foreground mt-1">
                                            {experiment.description}
                                        </p>
                                    </div>

                                    <div className="flex gap-2">
                                        {experiment.status === 'draft' && (
                                            <Button
                                                size="sm"
                                                onClick={() => onUpdateExperiment?.(experiment.id, { status: 'running' })}
                                            >
                                                <Play className="h-3 w-3 mr-1" />
                                                Start
                                            </Button>
                                        )}
                                        {experiment.status === 'running' && (
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                onClick={() => onUpdateExperiment?.(experiment.id, { status: 'paused' })}
                                            >
                                                <Pause className="h-3 w-3 mr-1" />
                                                Pause
                                            </Button>
                                        )}
                                    </div>
                                </div>
                            </CardHeader>

                            <CardContent className="space-y-6">
                                {/* Experiment Info */}
                                <div className="grid grid-cols-3 gap-4 text-sm">
                                    <div>
                                        <p className="text-muted-foreground">Started</p>
                                        <p className="font-medium">
                                            {new Date(experiment.startDate).toLocaleDateString()}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-muted-foreground">Variants</p>
                                        <p className="font-medium">{experiment.variants.length}</p>
                                    </div>
                                    <div>
                                        <p className="text-muted-foreground">Participants</p>
                                        <p className="font-medium">
                                            {experiment.results?.totalParticipants || 0}
                                        </p>
                                    </div>
                                </div>

                                {/* Variants Performance */}
                                <div className="space-y-3">
                                    <h4 className="font-medium">Variant Performance</h4>
                                    {experiment.variants.map((variant) => {
                                        const result = experiment.results?.variantResults.find(r => r.variantId === variant.id);
                                        return (
                                            <div key={variant.id} className="border rounded-lg p-4">
                                                <div className="flex justify-between items-center mb-2">
                                                    <div className="flex items-center gap-2">
                                                        <Badge variant={variant.isControl ? 'default' : 'secondary'}>
                                                            {variant.isControl ? 'Control' : 'Variant'}
                                                        </Badge>
                                                        <span className="font-medium">{variant.name}</span>
                                                    </div>
                                                    {result && (
                                                        <div className="text-right text-sm">
                                                            <p className="font-medium">{result.conversionRate.toFixed(2)}%</p>
                                                            <p className="text-muted-foreground">conversion</p>
                                                        </div>
                                                    )}
                                                </div>

                                                {result && (
                                                    <div className="grid grid-cols-4 gap-4 text-sm">
                                                        <div>
                                                            <p className="text-muted-foreground">Participants</p>
                                                            <p className="font-medium">{result.participants}</p>
                                                        </div>
                                                        <div>
                                                            <p className="text-muted-foreground">Conversions</p>
                                                            <p className="font-medium">{result.conversions}</p>
                                                        </div>
                                                        <div>
                                                            <p className="text-muted-foreground">Revenue</p>
                                                            <p className="font-medium">${result.revenue.toFixed(0)}</p>
                                                        </div>
                                                        <div>
                                                            <p className="text-muted-foreground">Improvement</p>
                                                            <p className={`font-medium ${result.improvement > 0 ? 'text-green-600' : result.improvement < 0 ? 'text-red-600' : ''}`}>
                                                                {result.improvement > 0 ? '+' : ''}{result.improvement.toFixed(1)}%
                                                            </p>
                                                        </div>
                                                    </div>
                                                )}

                                                <div className="mt-2">
                                                    <Progress value={variant.trafficPercentage} className="h-2" />
                                                    <p className="text-xs text-muted-foreground mt-1">
                                                        {variant.trafficPercentage}% traffic allocation
                                                    </p>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>

                                {/* Statistical Significance */}
                                {experiment.results && (
                                    <div className="border-t pt-4">
                                        <div className="flex justify-between items-center">
                                            <div>
                                                <p className="font-medium">Statistical Significance</p>
                                                <p className="text-sm text-muted-foreground">
                                                    Confidence: {(experiment.results.confidence * 100).toFixed(1)}%
                                                </p>
                                            </div>
                                            {experiment.results.winner && (
                                                <Badge variant="default">
                                                    <TrendingUp className="h-3 w-3 mr-1" />
                                                    Winner: {experiment.results.winner}
                                                </Badge>
                                            )}
                                        </div>
                                        <Progress
                                            value={experiment.results.statisticalSignificance * 100}
                                            className="h-2 mt-2"
                                        />
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    ))
                )}
            </div>
        </div>
    );
};

export default ABTestManager;
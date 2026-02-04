'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  MoreHorizontal,
  Search,
  Filter,
  Download,
  Mail,
  Edit,
  Trash2,
  Eye,
} from 'lucide-react';

interface PaperPartner {
  id: string;
  businessName: string;
  domain: string;
  status: 'active' | 'trial' | 'suspended' | 'seeding';
  licensingStatus: 'trial' | 'paid' | 'suspended';
  creditsRemaining: number;
  monthlyAllocation: number;
  lastActive?: Date;
  contactEmail: string;
}

interface PaperPartnersTableProps {
  partners: PaperPartner[];
  onViewDetails?: (id: string) => void;
  onEdit?: (id: string) => void;
  onDelete?: (id: string) => void;
  onSendMessage?: (id: string) => void;
}

export function PaperPartnersTable({
  partners,
  onViewDetails,
  onEdit,
  onDelete,
  onSendMessage,
}: PaperPartnersTableProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'name' | 'credits' | 'lastActive'>('name');

  // Filter and sort partners
  const filteredPartners = partners
    .filter((partner) => {
      const matchesSearch =
        partner.businessName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        partner.domain.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus =
        statusFilter === 'all' || partner.status === statusFilter;
      return matchesSearch && matchesStatus;
    })
    .sort((a, b) => {
      if (sortBy === 'name') {
        return a.businessName.localeCompare(b.businessName);
      } else if (sortBy === 'credits') {
        return b.creditsRemaining - a.creditsRemaining;
      } else if (sortBy === 'lastActive' && a.lastActive && b.lastActive) {
        return b.lastActive.getTime() - a.lastActive.getTime();
      }
      return 0;
    });

  const getStatusVariant = (status: PaperPartner['status']) => {
    switch (status) {
      case 'active':
        return 'success';
      case 'trial':
        return 'default';
      case 'suspended':
        return 'danger';
      case 'seeding':
        return 'warning';
      default:
        return 'default';
    }
  };

  const getCreditStatus = (remaining: number, allocation: number) => {
    const percentage = (remaining / allocation) * 100;
    if (percentage <= 10) return { color: 'danger', label: 'Critical' };
    if (percentage <= 25) return { color: 'warning', label: 'Low' };
    return { color: 'success', label: 'Good' };
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Paper Partners</CardTitle>
            <CardDescription>
              Manage your newspaper network ({filteredPartners.length} partners)
            </CardDescription>
          </div>
          <Button size="sm">
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4 mt-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Search partners..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[180px]">
              <Filter className="w-4 h-4 mr-2" />
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="trial">Trial</SelectItem>
              <SelectItem value="suspended">Suspended</SelectItem>
              <SelectItem value="seeding">Seeding</SelectItem>
            </SelectContent>
          </Select>

          <Select value={sortBy} onValueChange={(value: any) => setSortBy(value)}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="name">Name</SelectItem>
              <SelectItem value="credits">Credits</SelectItem>
              <SelectItem value="lastActive">Last Active</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>

      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Newspaper</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Credits</TableHead>
                <TableHead>License</TableHead>
                <TableHead>Last Active</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredPartners.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                    No partners found
                  </TableCell>
                </TableRow>
              ) : (
                filteredPartners.map((partner) => {
                  const creditStatus = getCreditStatus(
                    partner.creditsRemaining,
                    partner.monthlyAllocation
                  );

                  return (
                    <TableRow key={partner.id}>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-medium">{partner.businessName}</span>
                          <span className="text-sm text-gray-500">{partner.domain}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={getStatusVariant(partner.status)} dot>
                          {partner.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-medium">
                            {partner.creditsRemaining.toLocaleString()} / {partner.monthlyAllocation.toLocaleString()}
                          </span>
                          <Badge variant={creditStatus.color as any} className="w-fit mt-1">
                            {creditStatus.label}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={partner.licensingStatus === 'paid' ? 'success' : 'default'}>
                          {partner.licensingStatus}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-gray-500">
                          {partner.lastActive
                            ? new Date(partner.lastActive).toLocaleDateString()
                            : 'Never'}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreHorizontal className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => onViewDetails?.(partner.id)}>
                              <Eye className="w-4 h-4 mr-2" />
                              View Details
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => onSendMessage?.(partner.id)}>
                              <Mail className="w-4 h-4 mr-2" />
                              Send Message
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => onEdit?.(partner.id)}>
                              <Edit className="w-4 h-4 mr-2" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => onDelete?.(partner.id)}
                              className="text-red-600"
                            >
                              <Trash2 className="w-4 h-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}

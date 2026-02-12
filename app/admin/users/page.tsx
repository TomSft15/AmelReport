import { createServerSupabaseClient } from "@/lib/supabase/server";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatDate } from "@/lib/utils";
import { UserInviteModal } from "@/components/admin/user-invite-modal";
import { UserActions } from "@/components/admin/user-actions";

export default async function UsersPage() {
  const supabase = await createServerSupabaseClient();

  // Get current user
  const {
    data: { user: currentUser },
  } = await supabase.auth.getUser();

  // Get all users
  const { data: users } = await supabase
    .from("profiles")
    .select("*")
    .order("created_at", { ascending: false }) as any;

  // Get pending invitations
  const { data: invitations } = await supabase
    .from("invitations")
    .select("*")
    .eq("status", "pending")
    .order("created_at", { ascending: false }) as any;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Utilisateurs</h1>
          <p className="text-muted-foreground">
            Gérez les codes d'invitation et les accès
          </p>
        </div>
        <UserInviteModal />
      </div>

      {/* Pending invitations */}
      {invitations && invitations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Invitations en attente</CardTitle>
            <CardDescription>
              {invitations.length} invitation(s) en attente de réponse
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Email</TableHead>
                  <TableHead>Invité le</TableHead>
                  <TableHead>Expire le</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {invitations.map((invitation: any) => (
                  <TableRow key={invitation.id}>
                    <TableCell className="font-medium">{invitation.email}</TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {formatDate(invitation.created_at)}
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {formatDate(invitation.expires_at)}
                    </TableCell>
                    <TableCell className="text-right">
                      <UserActions
                        userId={invitation.id}
                        email={invitation.email}
                        status="pending"
                        isCurrentUser={false}
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Active users */}
      <Card>
        <CardHeader>
          <CardTitle>Liste des utilisateurs</CardTitle>
          <CardDescription>
            {users?.length || 0} utilisateur(s) au total
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Email</TableHead>
                <TableHead>Nom</TableHead>
                <TableHead>Rôle</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Invité le</TableHead>
                <TableHead>Dernière connexion</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users && users.length > 0 ? (
                users.map((user: any) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">{user.email}</TableCell>
                    <TableCell>{user.display_name || "-"}</TableCell>
                    <TableCell>
                      <Badge variant={user.role === "admin" ? "default" : "secondary"}>
                        {user.role === "admin" ? "Admin" : "Utilisateur"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          user.invitation_status === "active"
                            ? "default"
                            : user.invitation_status === "pending"
                            ? "secondary"
                            : "destructive"
                        }
                      >
                        {user.invitation_status === "active"
                          ? "Actif"
                          : user.invitation_status === "pending"
                          ? "En attente"
                          : "Désactivé"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {formatDate(user.invited_at)}
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {user.last_login_at ? formatDate(user.last_login_at) : "-"}
                    </TableCell>
                    <TableCell className="text-right">
                      <UserActions
                        userId={user.id}
                        email={user.email}
                        status={user.invitation_status}
                        isCurrentUser={user.id === currentUser?.id}
                      />
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground">
                    Aucun utilisateur
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

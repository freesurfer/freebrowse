using Microsoft.AspNetCore.SignalR;

namespace WebUI.Hubs;

public class PointSetsHub : Hub
{
	public void JoinGroup(string groupName)
	{
		this.Groups.AddToGroupAsync(this.Context.ConnectionId, groupName);
	}

	public void LeaveGroup(string groupName)
	{
		this.Groups.RemoveFromGroupAsync(this.Context.ConnectionId, groupName);
	}
}

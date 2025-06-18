using Microsoft.AspNetCore.SignalR;
using System.Threading.Tasks;

public class ChatHub : Hub
{
    public async Task JoinRoom(string roomName, string userName)
    {
        await Groups.AddToGroupAsync(Context.ConnectionId, roomName);
        await Clients.Group(roomName).SendAsync("ReceiveMessage", "System", $"{userName} has joined {roomName}");
    }

    public async Task LeaveRoom(string roomName, string userName)
    {
        await Groups.RemoveFromGroupAsync(Context.ConnectionId, roomName);
        await Clients.Group(roomName).SendAsync("ReceiveMessage", "System", $"{userName} has left {roomName}");
    }

    public async Task SendMessage(string roomName, string userName, string message)
    {
        await Clients.Group(roomName).SendAsync("ReceiveMessage", userName, message);
    }
}

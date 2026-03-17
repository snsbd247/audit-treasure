<?php

namespace App\Http\Controllers\Messaging;

use App\Http\Controllers\BaseController;
use App\Models\Conversation;
use App\Models\Message;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class MessageController extends BaseController
{
    /**
     * List conversations for current user.
     */
    public function conversations(Request $request)
    {
        $userId = $request->user()->id;

        $conversations = Conversation::whereHas('participants', function ($q) use ($userId) {
            $q->where('user_id', $userId);
        })
        ->with(['participants:id,name,username', 'latestMessage.sender:id,name'])
        ->withCount(['messages as unread_count' => function ($q) use ($userId) {
            $q->where('sender_id', '!=', $userId)->where('is_read', 0);
        }])
        ->orderByDesc('updated_at')
        ->get();

        return $this->success($conversations);
    }

    /**
     * Create a new conversation (or return existing one between two users).
     */
    public function createConversation(Request $request)
    {
        $data = $request->validate([
            'participant_id' => 'required|exists:users,id',
            'subject' => 'nullable|string|max:255',
            'message' => 'nullable|string',
        ]);

        $userId = $request->user()->id;
        $participantId = $data['participant_id'];

        if ($userId === $participantId) {
            return $this->error('Cannot create conversation with yourself', 400);
        }

        // Check for existing 1-on-1 conversation
        $existing = Conversation::whereHas('participants', function ($q) use ($userId) {
            $q->where('user_id', $userId);
        })->whereHas('participants', function ($q) use ($participantId) {
            $q->where('user_id', $participantId);
        })->withCount('participants')->having('participants_count', 2)->first();

        if ($existing) {
            // Send message if provided
            if (!empty($data['message'])) {
                Message::create([
                    'conversation_id' => $existing->id,
                    'sender_id' => $userId,
                    'message' => $data['message'],
                ]);
                $existing->touch();
            }
            return $this->success($existing->load('participants:id,name,username'));
        }

        // Create new conversation
        $conversation = DB::transaction(function () use ($userId, $participantId, $data) {
            $conv = Conversation::create(['subject' => $data['subject'] ?? null]);
            $conv->participants()->attach([$userId, $participantId]);

            if (!empty($data['message'])) {
                Message::create([
                    'conversation_id' => $conv->id,
                    'sender_id' => $userId,
                    'message' => $data['message'],
                ]);
                $conv->touch();
            }

            return $conv;
        });

        return $this->created($conversation->load('participants:id,name,username'));
    }

    /**
     * Get messages for a conversation.
     */
    public function messages(Request $request, string $id)
    {
        $userId = $request->user()->id;

        $conversation = Conversation::whereHas('participants', function ($q) use ($userId) {
            $q->where('user_id', $userId);
        })->findOrFail($id);

        $messages = $conversation->messages()
            ->with('sender:id,name,username')
            ->orderBy('created_at')
            ->get();

        // Mark messages from others as read
        Message::where('conversation_id', $id)
            ->where('sender_id', '!=', $userId)
            ->where('is_read', 0)
            ->update(['is_read' => 1]);

        return $this->success($messages);
    }

    /**
     * Send a message in a conversation.
     */
    public function sendMessage(Request $request, string $id)
    {
        $data = $request->validate(['message' => 'required|string']);
        $userId = $request->user()->id;

        $conversation = Conversation::whereHas('participants', function ($q) use ($userId) {
            $q->where('user_id', $userId);
        })->findOrFail($id);

        $message = Message::create([
            'conversation_id' => $id,
            'sender_id' => $userId,
            'message' => $data['message'],
        ]);

        $conversation->touch();

        return $this->created($message->load('sender:id,name,username'));
    }

    /**
     * Mark a single message as read.
     */
    public function markRead(Request $request, string $id)
    {
        $message = Message::findOrFail($id);

        // Only mark if user is not the sender
        if ($message->sender_id !== $request->user()->id) {
            $message->update(['is_read' => 1]);
        }

        return $this->success(null, 'Marked as read');
    }

    /**
     * Get total unread message count for current user.
     */
    public function unreadCount(Request $request)
    {
        $userId = $request->user()->id;

        $count = Message::whereHas('conversation.participants', function ($q) use ($userId) {
            $q->where('user_id', $userId);
        })
        ->where('sender_id', '!=', $userId)
        ->where('is_read', 0)
        ->count();

        return $this->success(['unread_count' => $count]);
    }
}

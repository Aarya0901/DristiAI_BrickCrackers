"""Unit tests for auto_generate_seatmap and dynamic SeatAnchorTracker."""
import unittest
from backend.seat_anchor import auto_generate_seatmap, SeatAnchorTracker, STATE_TRACKED


class TestAutoSeatmap(unittest.TestCase):
    def test_auto_generate_empty(self):
        result = auto_generate_seatmap([])
        self.assertEqual(result, {"seats": []})

    def test_auto_generate_grid(self):
        # 4 boxes in a 2x2 grid
        bboxes = [
            [50, 50, 150, 150],    # Row 1, Col 1 -> A1
            [250, 50, 350, 150],   # Row 1, Col 2 -> A2
            [50, 250, 150, 350],   # Row 2, Col 1 -> B1
            [250, 250, 350, 350],  # Row 2, Col 2 -> B2
        ]
        seatmap = auto_generate_seatmap(bboxes, frame_shape=(400, 400), neighbor_radius=250.0)
        seats = seatmap["seats"]
        self.assertEqual(len(seats), 4)

        seat_ids = [s["seat_id"] for s in seats]
        self.assertIn("A1", seat_ids)
        self.assertIn("A2", seat_ids)
        self.assertIn("B1", seat_ids)
        self.assertIn("B2", seat_ids)

        # Check neighbors
        a1 = next(s for s in seats if s["seat_id"] == "A1")
        self.assertIn("A2", a1["neighbors"])
        self.assertIn("B1", a1["neighbors"])

    def test_seat_anchor_tracker_with_dict(self):
        bboxes = [
            [100, 100, 200, 200],
            [300, 100, 400, 200],
        ]
        seatmap = auto_generate_seatmap(bboxes)
        tracker = SeatAnchorTracker(seatmap=seatmap)
        self.assertEqual(len(tracker.seats), 2)

        # Feed detections at the same locations
        assignments = tracker.assign_seats([
            {"bbox": [100, 100, 200, 200], "conf": 0.9},
            {"bbox": [300, 100, 400, 200], "conf": 0.85},
        ])
        self.assertEqual(len(assignments), 2)
        states = [a["state"] for a in assignments]
        self.assertTrue(all(s == STATE_TRACKED for s in states))


if __name__ == "__main__":
    unittest.main()

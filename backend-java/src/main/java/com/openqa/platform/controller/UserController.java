package com.openqa.platform.controller;

import com.openqa.platform.dto.UserDTO;
import com.openqa.platform.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/users")
public class UserController {

    @Autowired
    private UserService userService;

    @GetMapping("/{username}")
    public ResponseEntity<UserDTO> getUserProfile(@PathVariable String username) {
        UserDTO userDTO = userService.getUserProfile(username);
        return ResponseEntity.ok(userDTO);
    }

    @GetMapping("/leaderboard")
    public ResponseEntity<List<UserDTO>> getLeaderboard() {
        List<UserDTO> leaderboard = userService.getLeaderboard();
        return ResponseEntity.ok(leaderboard);
    }
}

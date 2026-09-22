package br.com.studymate.exception;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.ResponseStatus;

@ResponseStatus(HttpStatus.NOT_FOUND)
public class UsuarioNotFoundException extends RuntimeException {
    public UsuarioNotFoundException(Integer id) {
        super ("Usuário não encontrado com ID: " + id);
    }
}
